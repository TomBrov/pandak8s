data "aws_caller_identity" "current" {}

data "aws_iam_openid_connect_provider" "github" {
    url = "https://token.actions.githubusercontent.com"
}

resource "aws_ecr_repository" "web" {
  name = "${var.github_repo}-web"
  image_tag_mutability = "IMMUTABLE"
  force_delete = true
}

resource "aws_ecr_repository" "api" {
  name = "${var.github_repo}-api"
  image_tag_mutability = "IMMUTABLE"
  force_delete = true
}

resource "aws_iam_role" "github_ecr_role" {
  name = "github-ecr-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
            ]
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ecr_access" {
  name = "github-ecr-access-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowECRLogin",
        Effect = "Allow",
        Action = ["ecr:GetAuthorizationToken"],
        Resource = "*"
      },
      {
        Sid    = "AllowPushPullSpecificRepos",
        Effect = "Allow",
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ],
        Resource = [
          aws_ecr_repository.web.arn,
          aws_ecr_repository.api.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_attach" {
  role       = aws_iam_role.github_ecr_role.name
  policy_arn = aws_iam_policy.ecr_access.arn
}
