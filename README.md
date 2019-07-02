# COFFEE SHOP STATE CHANNEL DEMO

То run this demo you should run or connect to AE node

clone this repo
```git clone this_repo```

install packages
```npm install```

run the demo
```npm start```

The demo app can be started on http://localhost:3000

You as client and "the coffee shop" as back end, in a browser you can paste your private/secret key to OPEN a channel, sign ON and OFF chain txs are in the front end.
Back end, check and sign transactions too with own private/secret key.

The app demonstrates how you deposit some aettos, create on chain tx and after that you can purchase a coffee from "the coffee shop " where all txs are very fast and transparent. You have basic history and can watch your balance

If there is no off chain transaction for less than a minute channel close itself.
There are some logs in the browser and terminal that you can switch on/off.