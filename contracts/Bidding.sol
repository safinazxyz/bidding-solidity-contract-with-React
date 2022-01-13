// SPDX-License-Identifier:MIT
pragma solidity ^0.6;

contract Bidding {
    address public owner;
    enum State {
        Created,
        Ended
    }
    State private state;

    mapping(address => uint256) public addressToAmountBid;
    uint256[99] public bidValues;
    address[] public bidders;
    uint256 public creationTimeFirst;
    bool public ifEveryoneBid = false;
    uint256[] private bidValueIndex;
    int256 public counter;

    modifier isOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    modifier inState(State _state) {
        require(state == _state);
        _;
    }

    constructor() public {
        owner = msg.sender;
        state = State.Created;
    }

    function startBidding() public isOwner {
        creationTimeFirst = block.timestamp;
        ifEveryoneBid = true;
        counter = 0;
    }

    function flipBidState() public isOwner {
        ifEveryoneBid = !ifEveryoneBid;
    }

    function bid(uint256 _value)
        public
        payable
        inState(State.Created)
        returns (uint256)
    {
        require(ifEveryoneBid);
        int256 counterInstant = int256(
            (block.timestamp - creationTimeFirst) / 60
        );
        if (counterInstant > counter) {
            require(getBidResult() == 0);
            counter = counterInstant;
        }

        require(
            _value >= 0 && _value < 100,
            "Please enter a number between 0 and 99"
        );
        if (bidValues[_value] == 0) {
            bidValueIndex.push(_value);
        }
        addressToAmountBid[msg.sender] += msg.value;
        bidders.push(msg.sender);
        bidValues[_value] += msg.value;
    }

    function getBidResult() public view returns (int256 _finalResult) {
        _finalResult = getLargest();
        return _finalResult;
    }

    function getLargest() private view returns (int256) {
        uint256 max_var_prev = 0;
        uint256 i;
        uint256 max_var_next = 0;
        int256 return_max_var;
        int256 return_prev_var;
        if (bidValueIndex.length > 1) {
            for (i = 0; i < bidValueIndex.length - 1; i++) {
                if (max_var_prev < bidValues[bidValueIndex[i]]) {
                    max_var_prev = bidValues[bidValueIndex[i]];
                    return_prev_var = int256(bidValueIndex[i]);
                }
                if (max_var_next < bidValues[bidValueIndex[i + 1]]) {
                    max_var_next = bidValues[bidValueIndex[i + 1]];
                    return_max_var = int256(bidValueIndex[i + 1]);
                }
                if (max_var_next == max_var_prev) {
                    return_max_var = -1;
                }
            }
            return (
                return_max_var != -1
                    ? max_var_next > max_var_prev
                        ? return_max_var
                        : return_prev_var
                    : -1
            );
        } else if (bidValueIndex.length == 1) {
            return int256(bidValueIndex[0]);
        }
    }

    function allBidderWithdraw() public isOwner {
        msg.sender.transfer(address(this).balance);
        for (
            uint256 bidderIndex = 0;
            bidderIndex < bidders.length;
            bidderIndex++
        ) {
            address bidder = bidders[bidderIndex];
            addressToAmountBid[bidder] = 0;
        }
        bidders = new address[](0);
    }

    function withdraw(address _adress) public isOwner {
        msg.sender.transfer(addressToAmountBid[_adress]);
        addressToAmountBid[_adress] = 0;
    }
}
