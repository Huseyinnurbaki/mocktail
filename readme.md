![Docker Image Version (latest by date)](https://img.shields.io/docker/v/hhaluk/mocktail?color=blue&logo=docker)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/hhaluk/mocktail?color=B4D4A55&logo=docker)
![Docker Image Version (latest semver)](https://img.shields.io/docker/v/hhaluk/mocktail?label=stable-version&logo=docker&sort=semver&style=flat-square)
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/Huseyinnurbaki/mocktail?include_prereleases&logo=github)
[![Docker Build CI](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml/badge.svg?branch=master)](https://github.com/Huseyinnurbaki/mocktail/actions/workflows/dockerize.yml)
![Docker Pulls](https://img.shields.io/docker/pulls/hhaluk/mocktail?color=gray&logo=docker)

![alt text](./howto/mt.png "mt")

# Mocktail V2 is here !


### Mocktail is completely free, 11mb,self-hosted, containerized mock server with a dashboard. There are no limitations or restrictions unlike most mock servers. You can mock any request. Mock apis can be exported and imported. Learn more on  [Capabilities](#capabilities). 

# Quickstart 🚀

## Deploy with Helm ⎈  
> youtube tutorial is being prepared.

```console
$ helm repo add hhaluk https://huseyinnurbaki.github.io/charts/
$ helm install mocktail hhaluk/mocktail

****** Application url will be prompted. ******
```
> See values.yaml at [https://github.com/Huseyinnurbaki/charts](https://github.com/Huseyinnurbaki/charts/tree/release) under hhaluk/mocktail for customized deployment. 

## Run Mocktail in a docker container 🐳 [See Youtube Tutorial](https://youtu.be/1y34yML7ET4)
```console
$ docker run -p 4000:4000 -d hhaluk/mocktail:2.0.1
```
> See "stable-version" tag at the beginning of this file to install the latest stable version.
### Go to **localhost:4000** 🏃

---
<p align="center">
  <img src="./howto/mocktail.gif" alt="mocktail_gif" />
</p>

> This gif belongs to the previous ui, which is similar to the new dashboard. Will be replaced soon.


# Capabilities 😎

- Generate mock apis for Get/Post/Put/Patch/Delete using the Generate tab.
- Catalog tab lists added apis.
- See api details by clicking details button of an api under Catalog tab.
- Test added apis.
- Remove unused apis.
- Export search results to json.
- Import exported json.



# V2 Keynotes ✅

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
- [ ] Exceptions Scenarios

## ToDo
- UI improvements
