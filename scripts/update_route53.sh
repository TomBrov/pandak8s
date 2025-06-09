#!/bin/bash

SUBDOMAIN="test.vicarius.xyz"
DOMAIN="vicarius.xyz"
NAMESPACE="pandak8s"
SERVICE_NAME="app-pandak8s-ingress-nginx-controller"
TTL=300

echo "Looking for NLB DNS name for service $SERVICE_NAME in namespace $NAMESPACE..."
NLB_DNS=$(kubectl get svc -n "$NAMESPACE" "$SERVICE_NAME" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
if [[ -z "$NLB_DNS" ]]; then
  echo "Could not find the NLB DNS name. Make sure the service is of type LoadBalancer and deployed."
  exit 1
fi
echo "NLB DNS name: $NLB_DNS"

echo "Looking for Hosted Zone ID for $DOMAIN..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" \
  --query "HostedZones[0].Id" --output text | sed 's|/hostedzone/||')
if [[ -z "$HOSTED_ZONE_ID" ]]; then
  echo "Hosted zone for $DOMAIN not found in Route 53."
  exit 1
fi
echo "Hosted Zone ID: $HOSTED_ZONE_ID"

echo "🔨 Creating/Updating DNS record: $SUBDOMAIN → $NLB_DNS"
CHANGE_BATCH=$(cat <<EOF
{
  "Comment": "Update record to point to NLB",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$SUBDOMAIN",
        "Type": "CNAME",
        "TTL": $TTL,
        "ResourceRecords": [
          {
            "Value": "$NLB_DNS"
          }
        ]
      }
    }
  ]
}
EOF
)

aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch "$CHANGE_BATCH"

if [[ $? -eq 0 ]]; then
  echo "DNS record updated successfully!"
else
  echo "Failed to update DNS record."
fi
