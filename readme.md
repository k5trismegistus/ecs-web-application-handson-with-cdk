## Build docker image

```
$ cd handson
$ docker build -t ecs-handson-flask-app .
```

## Setup CDK

```
$ npx cdk bootstrap
```

## Deploy

```
$ npx cdk synth
$ npx cdk deploy
```

## Destroy

```
$ npx cdk destroy
```
