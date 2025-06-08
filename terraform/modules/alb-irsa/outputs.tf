output "role_arn" {
  description = "IAM role ARN for ALB ingress controller service account"
  value       = aws_iam_role.this.arn
}