variable "region" {
  description = "AWS region where the infrastructure will be deployed (e.g., us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "vpc_name" {
  description = "The name of the VPC to be created"
  type        = string
  default     = "barkuni-vpc"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "A list of CIDR blocks for the private subnets across availability zones"
  type        = list(string)
}

variable "public_subnets" {
  description = "A list of CIDR blocks for the public subnets across availability zones"
  type        = list(string)
}

variable "cluster_name" {
  description = "The name of the EKS cluster"
  type        = string
  default     = "barkuni-cluster"
}

variable "repo_url" {
  description = "Git repository URL"
  type        = string
}

