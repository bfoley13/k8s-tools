FROM node:16-alpine3.11 as build-node
RUN apk --no-cache --virtual build-dependencies add \
        python \
        make \
        g++
RUN export NODE_OPTIONS="--max-old-space-size=1024"
WORKDIR /app
COPY frontend/ .
RUN npm install
RUN npm run build

FROM golang:1.17rc2-alpine3.14 as build-go

ENV GOPATH ""
RUN go env -w GOPROXY=direct
RUN apk add git

ADD go.mod go.sum ./
RUN go mod download
ADD server/ ./server/
COPY --from=build-node /app/build ./server/build
RUN go build -v -o /k8s_tooling ./server/

FROM alpine:3.13
ARG helm2version=2.17.0
ARG helm3version=3.6.3

RUN apk add --no-cache wget\
  && wget https://get.helm.sh/helm-v${helm2version}-linux-amd64.tar.gz \
  && tar -zxvf helm-v${helm2version}-linux-amd64.tar.gz \
  && mv linux-amd64/helm /usr/local/bin/helm2 \
  && wget https://get.helm.sh/helm-v${helm3version}-linux-amd64.tar.gz \
  && tar -zxvf helm-v${helm3version}-linux-amd64.tar.gz \
  && mv linux-amd64/helm /usr/local/bin/helm3

COPY --from=build-go /k8s_tooling /k8s_tooling

CMD ["/k8s_tooling"]