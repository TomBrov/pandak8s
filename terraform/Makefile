REGION ?= us-east-2
CLUSTER_NAME ?= barkuni-pandak8s-cluster
VAR_FILE ?= envs/dev.tfvars

.PHONY: init eks apply-all kubeconfig clean

init:
	@echo "Initializing Terraform..."
	terraform init

eks:
	@echo "Applying EKS cluster only..."
	terraform apply --var-file=$(VAR_FILE) -target=module.eks -auto-approve

kubeconfig:
	@echo "Updating kubeconfig for cluster access..."
	aws eks update-kubeconfig --region $(REGION) --name $(CLUSTER_NAME)

apply-all:
	@echo "Applying full Terraform configuration..."
	terraform apply --var-file=$(VAR_FILE) -auto-approve

destroy:
	@echo "Destroying all resources..."
	terraform destroy --var-file=$(VAR_FILE) -auto-approve

update-dns:
	@echo "Updating DNS records..."
	bash ../scripts/update_route53.sh

clean:
	@echo "Cleaning Terraform state..."
	rm -rf .terraform* terraform.tfstate*
