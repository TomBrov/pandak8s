data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = "${var.cluster_name}-alb-irsa"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "alb_controller" {
  # You can replace this with the official AWS policy if needed
  statement {
    actions = [
      "elasticloadbalancing:*",
      "ec2:Describe*",
      "iam:ListRoles",
      "cognito-idp:DescribeUserPoolClient",
      "waf-regional:GetWebACLForResource",
      "waf:GetWebACL",
      "shield:GetSubscriptionState",
      "shield:DescribeProtection",
      "shield:GetSubscriptionState",
      "acm:ListCertificates"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "this" {
  name   = "${var.cluster_name}-alb-policy"
  policy = data.aws_iam_policy_document.alb_controller.json
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.this.name
  policy_arn = aws_iam_policy.this.arn
}
