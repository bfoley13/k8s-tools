# k8s-tools
Go + React app to connect to managed k8s repos to help build and expand usage and addons

## Running Locally
Create a [GitHub access token](https://github.com/settings/tokens) with `repo` and `workflow` access.  Copy the `config.json.template` file to `config.json` within the `server` directory and add the GitHub access token you created to provide GitHub API access. 

### React Frontend
You can run the react app locally by running `npm install`, then `npm start` within the `frontend` directory.

#### VSCode Config
In order to follow formatting conventions via format-on-save: 
Install [ESLint VSCode Extention](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Enable ESLint formatting:
- In Settings.JSON (Open Command Palette with CMD+Shift+P and type `'Open Settings (JSON)'`)
- add/override
    ```
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    }
    ```
- restart VSCode

- Enable format on save in VSCode via settings

### Golang Backend
The golang app has dependencies on Helm 2 and 3, and git being installed on the local machine. Helm 2 and 3 must be in the path as `helm2` and `helm3` respectively.

To build the backend, you must run `npm run build` within the `frontend` directory and copy the resulting `/frontend/build/` directory into `/server/build`

You can run the golang app locally by building and running the service from the base directory as follows:


build: `go build -v -o ./k8s_tools ./server/`

run: `./k8s_tools`

note: if you get `pattern build/*: no matching files found` make sure to run `npm run build` and copy /frontend/build to /server/build to populate the file embed

## Dockerfile
The Dockerfile handles building the node frontend and adding the resulting build into the goland serivce through the `embed` package, and finally copying the built go binaries into a clean alpine image.

build: `docker build ./ -t k8s_tools`

run: `docker run -p 8080:8080 k8s_tools`