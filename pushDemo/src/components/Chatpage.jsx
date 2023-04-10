import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSigner } from "wagmi";
import { ethers } from "ethers";
import * as PushAPI from "@pushprotocol/restapi";
import "./styles.css";

const Chatpage = () => {
  const [message, setMessage] = useState("");
  const [chatRequests, setChatRequest] = useState([]);
  const [chats, setChats] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [toAddress, setToaddress] = useState("");
  const [toMessage, setToMesssage] = useState("");
  const [groupBar, setGroupBar] = useState(false);
  const [reAddress, setreAddress] = useState("");
  const [messsageHistory, setMessageHistory] = useState([]);

  const { address, isConnected } = useAccount();

  const { data: _signer, error, isLoading, isSuccess } = useSigner();

   // calls the get function to get an existing user and 
   // if error (creates a new user and gets their details)
  const _user = async () => {
    try {
      const userGet = await PushAPI.user.get({
        account: `eip155:${address}`,
      });
     
      return { userGet };
    } catch (error) {
     
      const user = await PushAPI.user.create({
        account: address,
      });
      const userGet = await PushAPI.user.get({
        account: `eip155:${address}`,
      });
     
      return { userGet };
    }
  };
  // retrieves the details of the a message/ group 
  // when the message/group is clicked on in the chatroom
  const details = async (toAddress) => {
    setShowChat(!showChat);
    setreAddress(toAddress);
    const chatMessage = [];
    if (!showChat) {
      const { chatHistory } = await fetchMessages(toAddress);

      chatHistory.reverse().forEach((element) => {
        chatMessage.push(element.messageContent);
      });
    }
    setMessageHistory(chatMessage);
  };
 // gets the pgp decrypted private key of a user 
 // which is required to read messages 
  const prerequiste = async () => {
    const { userGet } = await _user();
    const pgpDecryptedPvtKey = await PushAPI.chat.decryptPGPKey({
      encryptedPGPPrivateKey: userGet.encryptedPrivateKey,
      signer: _signer,
      env: "staging",
    });
    //console.log(pgpDecryptedPvtKey);
    return { pgpDecryptedPvtKey };
  };


  // this function sends messages to the specified reciever address 
  const sendMessage = async () => {
    const { pgpDecryptedPvtKey } = await prerequiste();
    try {
      const response = await PushAPI.chat.send({
        messageContent: message,
        messageType: "Text", // can be "Text" | "Image" | "File" | "GIF"
        receiverAddress: reAddress,
        signer: _signer,
        pgpPrivateKey: pgpDecryptedPvtKey,
      });
    
    } catch (error) {
      console.log(error);
    }
  };


  // fetch all the chats associated with a particular account
  const fetchChats = async () => {
    const { pgpDecryptedPvtKey } = await prerequiste();
    try {
      const chats = await PushAPI.chat.chats({
        account: `eip155:${address}`,
        toDecrypt: true,
        pgpPrivateKey: pgpDecryptedPvtKey,
      });
      console.log(chats);
      setChats(chats);

      // fetch all the chat requests associated with an account 
      const chatsRe = await PushAPI.chat.requests({
        account: `eip155:${address}`,
        toDecrypt: true,
        pgpPrivateKey: pgpDecryptedPvtKey,
      });
      console.log(chatsRe);
      setChatRequest(chatsRe);
    } catch (error) {
      console.log(error);
    }
  };
  // approve a chat request 
  const approveChat = async (senderAddress) => {
    const { pgpDecryptedPvtKey } = prerequiste();
    const response = await PushAPI.chat.approve({
      status: "Approved",
      senderAddress: senderAddress,
      signer: _signer,
      pgpPrivateKey: pgpDecryptedPvtKey,
    });
  };
// create a group
  const createGroup = async () => {
    const response = await PushAPI.chat.createGroup({
      groupName: "Push Group Chat 3",
      groupDescription: "This is the oficial group for Push Protocol",
      members: [
      ],
      groupImage: "",
      admins: ["0x3829E53A15856d1846e1b52d3Bdf5839705c29e5"],
      isPublic: true,
      account: "0xD993eb61B8843439A23741C0A3b5138763aE11a4",
      pgpPrivateKey: pgpDecryptedPvtKey, //decrypted private key
    });
  };

  // update details about the group, this requires most 
  // of the detais of the group to be provided

  const updateGroup = async () => {
      const response = await PushAPI.chat.updateGroup({
    chatId: '870cbb20f0b116d5e461a154dc723dc1485976e97f61a673259698aa7f48371c',
    groupName: 'Push Group Chat 3',
    groupDescription: 'This is the oficial group for Push Protocol',
    members: ['0x2e60c47edF21fa5e5A333347680B3971F1FfD456','0x3829E53A15856d1846e1b52d3Bdf5839705c29e5'],
    groupImage: '',
    admins: ['0x3829E53A15856d1846e1b52d3Bdf5839705c29e5'],
    account: '0xD993eb61B8843439A23741C0A3b5138763aE11a4',
    pgpPrivateKey: pgpDecryptedPvtKey, //decrypted private key
});
  }

// fetch all the messages of a single chat and displays it 
  const fetchMessages = async (convoId) => {
    const { pgpDecryptedPvtKey } = await prerequiste();

    try {
      const conversationHash = await PushAPI.chat.conversationHash({
        account: `eip155:${address}`,
        conversationId: convoId,
      });
      console.log(conversationHash);


     //retrieves the latest chat of a specified threadhash
      const chatLatest = await PushAPI.chat.latest({
        threadhash: conversationHash.threadHash,
        account: `eip155:${address}`,
        toDecrypt: true,
        pgpPrivateKey: pgpDecryptedPvtKey,
      });

      console.log(chatLatest);
     
      // retrieves the history of chats of a specified threadhash
      const chatHistory = await PushAPI.chat.history({
        threadhash: conversationHash.threadHash,
        account: `eip155:${address}`,
        toDecrypt: true,
        limit: 5,
        pgpPrivateKey: pgpDecryptedPvtKey,
      });
      console.log(chatHistory);
      return { chatHistory };
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      fetchChats();
      
    }
  }, [isConnected, isSuccess]);

  return (
    <div>
      {isConnected ? (
        <div className="container">
          <div className="members-side">
            <h3 className="members-title"> Chat Rooms</h3>
            <p className="members-title" onClick={() => setGroupBar(!groupBar)}>
              {" "}
              Create new group
            </p>
            {groupBar ? (
              <div className="group-form">
                <input
                  className="group-name"
                  // value={groupName}
                  // onChange={(e) => setGroupName(e.target.value)}
                />
                <input
                  className="group-desc"
                  // value={groupDesc}
                  // onChange={(e) => setGroupDesc(e.target.value)}
                />
                <button className="group-buttton"> new group</button>
              </div>
            ) : (
              <p></p>
            )}

            {chats?.map((chat) => (
              <div
                className="members-list"
                onClick={() => details(chat.did)}
                key={new Date()}
              >
                <p className="members-subtitle">
                  {" "}
                  {chat.did.slice(7, 20)}...
                  {chat.did.slice(40, chat.did.length - 1)}
                </p>
              </div>
            ))}

            <p className="members-title"> Chat requests</p>
            {chatRequests?.map((req) => (
              <div
                className="members-list"
                onClick={() => details(req.did)}
                key={new Date()}
              >
                <p className="members-subtitle">
                  {" "}
                  {req.did.slice(7, 20)}...
                  {req.did.slice(40, req.did.length - 1)}
                  <button onClick={() => approveChat(req.did)}> Approve</button>
                </p>
              </div>
            ))}
          </div>
          {showChat ? (
            <div>
              <p className="users-address">To</p>
              <p className="to-address">
                {reAddress.slice(7, 17)}...
                {reAddress.slice(40, reAddress.length - 1)}
              </p>
              <div className="textcontainer">
                {messsageHistory.map((mes, index) => (
                  <span className="text-text" key={index}>
                    {" "}
                    {mes}
                  </span>
                ))}
              </div>
              <div className="text-form">
                <input
                  className="text-input"
                  placeholder="Send a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button className="text-button" onClick={() => sendMessage()}>
                  {" "}
                  Enter
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="new-member-1">
                <p className="get-address">To : </p>
                <input
                  className="member-input"
                  placeholder="to address"
                  value={toAddress}
                  onChange={(e) => setToaddress(e.target.value)}
                />
              </div>
              <div className="new-member-2">
                <input
                  className="member-input"
                  placeholder="enter a message"
                  value={toMessage}
                  onChange={(e) => setToMesssage(e.target.value)}
                />
                <button className="add-button"> send </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="login-title"> Welcome to the Chat app</p>
          <ConnectButton />
        </div>
      )}
    </div>
  );
};

export default Chatpage;
