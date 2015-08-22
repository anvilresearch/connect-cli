# Anvil Connect

## <%= issuer %> project

### Running in Docker Containers

This generated project provides support for Redis, Anvil Connect, and nginx. To run a complete, production-ready set of containers you can use Docker Compose. First, you'll want to ensure a few things.

#### IP Address

If you're running on Linux, the IP address Connect will be bound to is localhost and/or the IP of your computer/server. Once the containers are running, you should be able to reach the service at `https://0.0.0.0`.

On Mac and other systems you may need to install boot2docker in order to run Docker containers locally. Once you've installed boot2docker, you can obtain the IP address of your local Docker host by running:

```bash
boot2docker ip
```

#### /etc/hosts

To work with your Anvil Connect instance locally, it's a good idea to make an entry in your `/etc/hosts` file. For example, on a Mac, you'll want to associate the (sub)domain you provided the generator with `boot2docker` IP address.

```bash
192.168.59.103 connect.example.io
```

#### RSA Key Pair


#### SSL Certificate

When you ran `nv init`, you may have opted to generate a self-signed SSL certificate. The files were created in the `nginx/certs` directory of this project. If you did not opt to generate these files, you'll need to provide your own `nginx.key` and `nginx.crt` files.


#### Start Anvil Connect

```bash
$ docker-compose up -d
```

#### Stop

```
$ docker-compose stop [connect|nginx|redis]
```

#### Restart

```
$ docker-compose restart
```

#### View Logs

```
$ docker-compose logs <connect|nginx|redis>
```


### Building Custom Containers

By default, Docker Compose is configured to use images provided by Anvil Research on Docker Hub. You can build images yourself by commenting out the `image` property of a service in `docker-compose.yml` and uncommenting the `build` property like so:

```yaml
connect:
  build: connect
  #image: anvilresearch/connect
  ...
```

While we highly recommend using the official images or provided Dockerfiles, if necessary you can modify them to suit your requirements. You can also push your own custom images to Docker Hub and use them to run Connect by referencing them in the `image` property in `docker-compose.yml`.

```yaml
connect:
  #build: connect
  image: <dockerhubusername>/connect
```


