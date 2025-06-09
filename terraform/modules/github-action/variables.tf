variable "aws_region" {
  description = "AWS region for ECR and IAM"
  type        = string
  default     = "us-east-1"
}

variable "github_org" {
  description = "GitHub organization or user"
  type        = string
  default     = "my-org"
}

variable "github_repo" {
  description = "GitHub repository name (monorepo)"
  type        = string
  default     = "my-repo"
}

variable "github_branch" {
  description = "Branch allowed to assume role"
  type        = string
  default     = "main"
}