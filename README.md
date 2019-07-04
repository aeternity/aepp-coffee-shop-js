# COFFEE SHOP STATE CHANNEL DEMO

https://coffee-shop.daepps.tech

То run this demo you should set your key pair as environment variables(publicKey && secretKey) and it would connect to the test net.

clone this repo
```git clone https://github.com/aeternity/aepp-coffee-shop-js.git```

install packages
```npm install```

build
```npm run build```

run the demo
```npm start```

The demo app can be started locally on http://localhost:3000 or can be tested on https://coffee-shop.daepps.tech

You as client and "the coffee shop" as back end, in a browser you can paste your private/secret key to OPEN a channel, sign ON and OFF chain txs are in the front end.
Back end, check and sign transactions too with own private/secret key.

The app demonstrates how you deposit some aettos, create on chain tx and after that you can purchase a coffee from "the coffee shop " where all txs are very fast and transparent. You have basic history and can watch your balance

If there is no off chain transaction for less than a minute channel close itself.
There are some logs in the browser and terminal that you can switch on/off.

P.S.: When you open a state channel, your account should have more than 1 AE(channel reserve) + 0.5 AE(coffee) = 1.5 AE to maintain.