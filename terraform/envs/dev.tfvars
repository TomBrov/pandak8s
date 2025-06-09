region        = "us-east-2"
vpc_name      = "pandak8s-vpc"
vpc_cidr      = "10.0.0.0/16"
cluster_name  = "pandak8s-cluster"

private_subnets = [
  "10.0.1.0/24",
  "10.0.2.0/24",
  "10.0.3.0/24"
]

public_subnets = [
  "10.0.101.0/24",
  "10.0.102.0/24",
  "10.0.103.0/24"
]

repo_url = "https://github.com/TomBrov/pandak8s.git"
github_org = "TomBrov"
github_repo = "pandak8s"
github_branch = "main"

