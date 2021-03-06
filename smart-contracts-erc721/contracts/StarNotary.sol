pragma solidity ^0.4.23;

import './ERC721Token.sol';

contract StarNotary is ERC721Token {

    struct Star {
        string name;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; // token => Star
    mapping(uint256 => uint256) public starsForSale;   // token => price

    function createStar(string _name, uint256 _tokenId) public {
        Star memory newStar = Star(_name);

        tokenIdToStarInfo[_tokenId] = newStar;

        ERC721Token.mint(_tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(this.ownerOf(_tokenId) == msg.sender);

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable {
        require(starsForSale[_tokenId] > 0);

        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost);

        clearOtherStates(_tokenId);

        ERC721Token.transferFromHelper(starOwner, msg.sender, _tokenId);

        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }

        starOwner.transfer(starCost);
    }


    function clearOtherStates(uint256 _tokenId) private {
        // clear approvals
        tokenToApproved[_tokenId] = address(0);

        // clear being on sale
        starsForSale[_tokenId] = 0;
    }
}