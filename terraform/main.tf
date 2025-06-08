data "aws_availability_zones" "available" {}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.1"

  name = var.vpc_name
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway = true
  single_nat_gateway = true
}

resource "aws_ecr_repository" "api" {
  name                 = "pandak8s-api"
  force_delete         = true
}

resource "aws_ecr_repository" "web" {
  name                 = "pandak8s-web"
  force_delete         = true
}

# EKS Cluster
module "eks" {
  depends_on = [module.vpc]
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.4"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"
  subnet_ids      = module.vpc.private_subnets
  vpc_id          = module.vpc.vpc_id
  enable_irsa     = true

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

module "alb_irsa" {
  source        = "./modules/alb-irsa"
  depends_on = [module.eks]
  cluster_name  = var.cluster_name
  oidc_provider = module.eks.oidc_provider_arn
  oidc_url      = module.eks.oidc_provider
}

resource "helm_release" "aws_load_balancer_controller" {
  name             = "aws-load-balancer-controller"
  repository       = "https://aws.github.io/eks-charts"
  chart            = "aws-load-balancer-controller"
  namespace        = "kube-system"
  create_namespace = false
  depends_on = [module.eks]

  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.alb_irsa.role_arn
  }
}

# resource "helm_release" "argocd" {
#   name             = "argocd"
#   repository       = "https://argoproj.github.io/argo-helm"
#   chart            = "argo-cd"
#   namespace        = "argocd"
#   create_namespace = true
#
#   set {
#     name  = "server.service.type"
#     value = "LoadBalancer"
#   }
#
#   set {
#     name  = "configs.params.server\.insecure"
#     value = "true"
#   }
#
#   depends_on = [module.eks]
# }
#
# resource "kubernetes_yaml" "argocd_app" {
#   yaml_body = file("./manifests/pandak8s-app.yaml")
#   depends_on = [helm_release.argocd]
# }
