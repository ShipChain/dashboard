# ShipChain Delegator and Validator Dashboard


#### Develop

To run it locally:

```
yarn run serve
```

and connect on https://localhost:8080

#### Build

To build it:

```
yarn run build
```

Part of the build step is prerendering the pages, which uses puppeteer to drive a headless chrome browser. Make sure to install all dependencies.


#### Deploy
To Deploy it for network.shipchain.io, be sure to build the latest version and then run:

```
./deploy.sh
```
