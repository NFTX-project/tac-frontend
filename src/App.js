import { React, useRef, useState } from "react";
import {
  useWallet,
  UseWalletProvider,
  ConnectionRejectedError,
} from "use-wallet";
import Web3 from "web3";
import TacAbi from "./contracts/TokenAppController.json";

// const chainId = 4;
const chainId = 1;

function App() {
  const wallet = useWallet();
  const { current: web3 } = useRef(new Web3(window.ethereum));

  /* const tac = new web3.eth.Contract(
    TacAbi,
    "0x92AbeF50275aBFb37BBf266c917B378d33036198"
  ); */
  const tac = new web3.eth.Contract(
    TacAbi,
    "0x13f89adb711c18F8bC218F5E0Ad508784eB8f4E2"
  );

  const contract = tac;
  const ContractAbi = TacAbi;

  window.counter = contract;
  const [funcParams, setFuncParams] = useState(JSON.parse("[[]]"));
  const [returnVals, setReturnVals] = useState(JSON.parse("[[]]"));
  if (wallet.error?.name) {
    return (
      <p>
        <span>
          {wallet.error instanceof ConnectionRejectedError
            ? "Connection error: the user rejected the activation"
            : wallet.error.name}
        </span>
        <button onClick={wallet.reset()}>retry</button>
      </p>
    );
  }
  return (
    <>
      <div>Chain ID: {chainId}</div>
      <div>Contract address: {contract._address}</div>
      <h1>Wallet</h1>
      {wallet.status === "connected" ? (
        <div>
          <div>Account: {wallet.account}</div>
          <div>Balance: {wallet.balance}</div>
          <button onClick={() => wallet.reset()}>disconnect</button>
        </div>
      ) : (
        <div>
          Connect:
          <button onClick={() => wallet.connect()}>MetaMask</button>
          <button onClick={() => wallet.connect("frame")}>Frame</button>
        </div>
      )}

      {ContractAbi.filter((item) => item.type === "function").map((func, i) => (
        <div key={i}>
          <h2>{func.name}</h2>
          {func.inputs.map((input, _i) => (
            <input
              key={_i}
              placeholder={`${input.name} (${input.type})`}
              value={(funcParams[i] && funcParams[i][_i]) || ""}
              onChange={(e) => {
                const newFuncParams = JSON.parse(JSON.stringify(funcParams));
                if (!newFuncParams[i]) {
                  newFuncParams[i] = [];
                }
                newFuncParams[i][_i] = e.target.value;
                setFuncParams(newFuncParams);
              }}
            />
          ))}
          {func.outputs.map((output, _i) => (
            <div key={_i}>{returnVals[i]}</div>
          ))}
          <button
            disabled={!wallet.account}
            onClick={() => {
              console.log(func.name);
              if (
                func.stateMutability &&
                func.stateMutability.includes("view")
              ) {
                contract.methods[func.name]()
                  .call({ from: wallet.account })
                  .then((...retValues) => {
                    const newReturnVals = JSON.parse(
                      JSON.stringify(returnVals)
                    );
                    newReturnVals[i] = retValues;
                    setReturnVals(newReturnVals);
                  });
              } else {
                contract.methods[func.name](...funcParams[i])
                  .send({ from: wallet.account })
                  .then((receipt) => {
                    console.log("receipt", receipt);
                  });
              }
            }}
          >
            Submit
          </button>
        </div>
      ))}
    </>
  );
}

// Wrap everything in <UseWalletProvider />
// eslint-disable-next-line import/no-anonymous-default-export
export default () => (
  <UseWalletProvider chainId={chainId}>
    <App />
  </UseWalletProvider>
);
