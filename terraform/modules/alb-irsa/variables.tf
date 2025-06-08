variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "oidc_provider" {
  description = "OIDC provider ARN for the EKS cluster"
  type        = string
}

variable "oidc_url" {
  description = "OIDC URL for the EKS cluster (e.g., https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLEDOCID)"
  type        = string
}
