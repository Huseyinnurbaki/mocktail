<div align="center">

# Mocktail

![Docker Image Version (latest by date)](https://img.shields.io/docker/v/hhaluk/mocktail?color=blue&logo=docker)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/hhaluk/mocktail?color=B4D4A55&logo=docker)
![Docker Image Version (latest semver)](https://img.shields.io/docker/v/hhaluk/mocktail?label=stable-version&logo=docker&sort=semver&style=flat-square)
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/Huseyinnurbaki/mocktail?include_prereleases&logo=github)
[![Docker Build CI](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml/badge.svg?branch=master)](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml)
![Docker Pulls](https://img.shields.io/docker/pulls/hhaluk/mocktail?color=gray&logo=docker)


Mocktail is completely free, 11mb, self-hosted, containerized mock server with a dashboard.

There are no limitations or restrictions unlike most mock servers. You can mock any request. Mock apis can be exported and imported.


</div>

<p align="center">
  <img src="https://github.com/Huseyinnurbaki/notes/blob/master/Storage/mocktail.gif?raw=true" alt="mocktail_gif" />
</p>



## Quickstart 🚀
<details>
  <summary>Helm ⎈ </summary>
  
  ## Deploy with Helm ⎈
  > youtube tutorial is being prepared.

```console
$ helm repo add hhaluk https://huseyinnurbaki.github.io/charts/
$ helm install mocktail hhaluk/mocktail

****** Application url will be prompted. ******
```
_See values.yaml at [https://github.com/Huseyinnurbaki/charts](https://github.com/Huseyinnurbaki/charts/tree/release) under hhaluk/mocktail for customized deployment._
</details>

<details>
  <summary>Docker 🐳 </summary>
  
  ## Run Mocktail in a docker container 🐳 [See Youtube Tutorial](https://youtu.be/1y34yML7ET4)
```console
$ docker run -p 4000:4000 -d hhaluk/mocktail:2.0.1
```
_See "stable-version" tag at the beginning of this file to install the latest stable version._
### Go to **localhost:4000** 🏃


</details>

<details>
  <summary>Local Developement 🏃🏃 </summary>
  
### Running Backend 🏃
I prefer vscode for [debug mode](https://marketplace.visualstudio.com/items?itemName=golang.go)
It's already configured. You can also use LiteIDE, GoLand, Delve directly. Up to you. 

If you are just going to work on the Dashboard, running it in a container is also an option. Use the command under "Run Mocktail in a docker container"

### Running Dashboard 🏃

```console
$ cd mocktail-dashboard
$ npm start 
```
### Go to **localhost:3001** 🏃

</details>

## Capabilities 😎

- Generate mock apis for Get/Post/Put/Patch/Delete using the Generate tab.
- Catalog tab lists added apis.
- See api details by clicking details button of an api under Catalog tab.
- Test added apis.
- Remove unused apis.
- Export search results to json.
- Import exported json.



## V2 Keynotes ✅

- [x] NodeJS replaced with Go Fiber.
- [x] React Upgrade
- [x] Containerize Mocktail
- [x] Build Scripts (GitHub Actions)
- [x] Update Readme
- [x] Define deployment commands.
   - [x] Docker
   - [x] Kubernetes (Helm)

## Upcoming Features 🔥

- [ ] Multiple DB Support
- [ ] Graphql support
- [ ] Exception Mocking

## ToDo
- UI improvements



