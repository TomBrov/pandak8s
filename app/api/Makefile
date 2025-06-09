TAG ?= latest

build:
	docker build -t brovy/pandak8s-backend:$(TAG) .

push:
	docker push brovy/pandak8s-backend:$(TAG)

run-local:
	docker run \
	  -v $$HOME/.kube:/root/.kube:ro \
	  -e KUBECONFIG=/root/.kube/config \
	  -p 8080:8080 \
	  brovy/pandak8s-backend:$(TAG)

build-ci:
	docker build -t $(REGISTRY)/$(PRODUCT)-$(SERVICE):$(TAG) .


push-ci:
	docker push $(REGISTRY)/$(PRODUCT)-$(SERVICE):$(TAG)
