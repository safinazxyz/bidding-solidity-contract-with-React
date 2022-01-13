import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import { Form, Button } from 'react-bootstrap';
import 'global';
import React, { Component } from 'react';
import Web3 from 'web3';
import { BIDDING_ADDRESS, BIDDING_ABI } from './compiled_contracts'
import { integer } from 'check-types';
import { exportDefaultSpecifier } from '@babel/types';

class App extends Component {

  componentDidMount() {
    this.loadBlockchainData()
    let newEndingTime = 60;
    this.intervalID = setInterval(() => {
      this.getIfBiddingIsStarted();
      if (this.state.ifEveryoneBid === true) {
        this.state.biddingStatu = 'Bidding Started'
        newEndingTime = 59 - parseInt(((Date.now() / 1000) - this.state.creationTime) % 60);
        if (newEndingTime === 0 && this.state.newBidResult != 0) {
          this.state.biddingStatu = 'Bidding Ended'
          this.setState({ bidResult: this.state.newBidResult })
          clearInterval(this.intervalID);
        }
        this.setState({ newEndingTime: newEndingTime })
      }
    }, 1000);
  }


  async getIfBiddingIsStarted() {
    const ifEveryoneBid = await this.state.biddingContacts.methods.ifEveryoneBid().call();
    if (ifEveryoneBid === true) {
      const creationTime = await this.state.biddingContacts.methods.creationTimeFirst().call();
      const resultValue = await this.state.biddingContacts.methods.getBidResult().call();
      this.setState({ creationTime: creationTime, ifEveryoneBid: ifEveryoneBid, newBidResult: resultValue })
    }
  }

  async loadBlockchainData() {
    const web3 = new Web3(window.web3.currentProvider)
    const accounts = await web3.eth.getAccounts()
    const balance = await web3.eth.getBalance(accounts[0])
    const etherBalance = await web3.utils.fromWei(balance, 'ether')
    console.log(etherBalance)
    this.setState({ account: accounts[0] })
    const biddingContacts = new web3.eth.Contract(BIDDING_ABI, BIDDING_ADDRESS)
    this.setState({ biddingContacts: biddingContacts })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      creationTime: '',
      ifEveryoneBid: false,
      bidResult: 0,
      newBidResult: 0,
      newEndingTime: 60,
      biddingContacts: null,
      biddingStatu: 'The Bidding Not Started',
      inputs: {
        'bid_value': '',
        'bid_price': ''
      }
    }
  }

  render() {
    const handleInputChanged = e => {
      const { name, value } = e.target;
      console.log(name, value)
      this.state.inputs[name] = value;
    };
    const bid = async () => {
      if (
        this.state.inputs['bid_price'] != "" &&
        this.state.inputs['bid_value'] != "" &&
        this.state.inputs['bid_price'] > 0 &&
        this.state.inputs['bid_value'] >= 0 &&
        this.state.ifEveryoneBid === true
      ) {
        console.log(this.state.inputs['bid_price'], 'bid-price')
        console.log(this.state.inputs['bid_value'], 'bid-value')
        await this.state.biddingContacts.methods.bid(this.state.inputs['bid_value']).send({
          from: this.state.account,
          value: this.state.inputs['bid_price'],
        })
          .on('receipt', function (receipt) {
            console.log("receipt", receipt);
            this.loadBlockChainData();
          })
          .on('error', function (error, receipt) {
            console.log("error", error);
            console.log("receipt", receipt);
          });
      } else {
        console.log("The bidding is finished");
      }
    }
    return (
      <div>
        <div className="container-fluid">
          <div id="loader" className="text-center">
            <p className="text-center">{this.state.biddingStatu}</p>
            <p className="text-center">Bid A Number</p>
            <p>{this.state.newEndingTime} Secs Left</p>
          </div>
          <div id="loader" className="text-center">
            <p className="text-center">Bid Result:</p>
            <p>{this.state.bidResult}</p>
          </div>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex justify-content-center">
              <div className="inputs-wrapper mx-auto">
                <Form.Group controlId="bid-value" className="mb-3">
                  <Form.Label>Bid Value</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter Bid Value"
                    name="bid_value"
                    onChange={handleInputChanged} />
                </Form.Group>
                <Form.Group controlId="bid-price" className="mb-4">
                  <Form.Label>Bid Price</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter Bid Price"
                    name="bid_price"
                    onChange={handleInputChanged} />
                </Form.Group>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={bid}>
                  Bid
                </Button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );

  }
}

export default App;
