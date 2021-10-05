// Yaml templating constants

export const baseYaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: <INGRESS_NAME>
spec:
  rules:
  - host: <HOST_URL>
    http:
      paths:
      - path: <URL_PATH>
        pathType: <PATH_TYPE>
        backend:
          service:
            name: <SERVICE_NAME>
            port:
              number: <SERVICE_PORT>
`;

export const rule = `  - host:  <HOST_URL>
    http:
      paths:
      - path: <URL_PATH>
        pathType: <PATH_TYPE>
        backend:
          service:
            name: <SERVICE_NAME>
            port:
              number: <SERVICE_PORT>
`;

export const path = `      - path: <URL_PATH>
        pathType: <PATH_TYPE>
        backend:
          service:
            name: <SERVICE_NAME>
            port:
              number: <SERVICE_PORT>
`;