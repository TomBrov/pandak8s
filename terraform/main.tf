data "aws_availability_zones" "available" {}

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "main" {
  name = "vicarius.xyz"
}

resource "aws_route53_record" "ingress_dns" {
  depends_on = [data.aws_route53_zone.main]
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "test.vicarius.xyz"
  type    = "CNAME"
  ttl     = 300
  records = ["placeholder.elb.amazonaws.com"]
}


module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.1"

  name = var.vpc_name
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway       = true
  single_nat_gateway       = true
  map_public_ip_on_launch  = true
  enable_dns_hostnames     = true
  enable_dns_support       = true

  public_subnet_tags = {
    "kubernetes.io/role/elb"                          = "1"
    "kubernetes.io/cluster/${var.cluster_name}"       = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"                 = "1"
    "kubernetes.io/cluster/${var.cluster_name}"       = "shared"
  }
}

resource "aws_ecr_repository" "pandak8s-web" {
  name = "pandak8s-web"
  image_tag_mutability = "IMMUTABLE"
  force_delete = true
}

resource "aws_ecr_repository" "pandak8s-api" {
  name = "pandak8s-api"
  image_tag_mutability = "IMMUTABLE"
  force_delete = true
}

module "eks" {
  depends_on = [module.vpc, aws_ecr_repository.pandak8s-api, aws_ecr_repository.pandak8s-web]
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.4"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"
  subnet_ids      = module.vpc.private_subnets
  vpc_id          = module.vpc.vpc_id
  enable_irsa     = true
  cluster_endpoint_public_access  = true
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]
  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    default = {
      desired_size = 2
      max_size     = 3
      min_size     = 1

      instance_types = ["t2.medium"]
      capacity_type  = "ON_DEMAND"

      iam_role_additional_policies = {
        worker_node_policies = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
        CNI_Policy = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
        ECR_ReadOnly = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
      }
    }
  }
}

module "eks_aws_auth" {
  source  = "terraform-aws-modules/eks/aws//modules/aws-auth"
  version = "20.8.4"

  depends_on = [module.eks]

  manage_aws_auth_configmap = true

  aws_auth_roles = [
    {
      rolearn  = module.eks.eks_managed_node_groups["default"].iam_role_arn
      username = "system:node:{{EC2PrivateDNSName}}"
      groups   = ["system:bootstrappers", "system:nodes"]
    }
  ]

  aws_auth_users = [
    {
      userarn  = data.aws_caller_identity.current.arn
      username = "admin"
      groups   = ["system:masters"]
    }
  ]
}

resource "helm_release" "argocd" {
  depends_on = [module.eks_aws_auth]
  name  = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  create_namespace = true
  namespace = "argocd"
  chart = "argo-cd"
  version = "7.7.16"
}

resource "kubernetes_manifest" "app-pandak8s" {
  depends_on = [helm_release.argocd]
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      name      = "app-pandak8s"
      namespace = "argocd"
    }
    spec = {
      project = "default"
      source = {
        repoURL        = var.repo_url
        targetRevision = "HEAD"
        path : "pandak8s"
      }
      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "pandak8s"
      }
      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
        syncOptions = ["CreateNamespace=true"]
      }
    }
  }
}