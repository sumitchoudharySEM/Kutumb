import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image';
import logo from '../public/images/logo.png';
import styles from '../styles/Home.module.css';
import bgLogo from '../public/images/logolg.png';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { BiX } from "react-icons/bi";
import axios from 'axios';
import { useState, useEffect, useContext } from 'react'
import { Alert, Button, Modal, Box, FormControl, TextField } from "@mui/material";
import Loader from '../app/components/loader';
import web3 from "web3";
import contract from "../share.json";
import { makeNFTClient } from '../app/components/extras/storage/utoken';
import Router from 'next/router';
import { useAccount, useConnect, useNetwork, useSignMessage, useSigner } from 'wagmi';

import { db } from "../app/firebase";
import { ref, update, get, set, child } from "firebase/database";
import { ethers } from 'ethers';
import { balanceABI } from '../app/components/extras/abi';
import { notifications } from '../app/components/extras/storage/init';

import myService1 from '../app/assets/img/service_1.jpeg';
import myService2 from '../app/assets/img/service_2.jpeg';
import myService3 from '../app/assets/img/service_3.jpeg';
import myService4 from '../app/assets/img/service_4.jpeg';

import my_img from '../app/team/meri_photo.png';
import divyanshu from '../app/team/divyanshu.jpg';
import harsh_sir from '../app/team/harsh_sir.png';
import ku_logo from '../app/team/kutumbh_logo.png';

// 0x74367351f1a6809ced9cc70654c6bf8c2d1913c9;
const contractAddress: string = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi:any = contract.abi;



const Home: NextPage = () => {

 

  const { chain: chainId, chains } = useNetwork();

  const { address, isConnected } = useAccount();

  const { connectors, isLoading: connecting, connectAsync } = useConnect();

  const { isSuccess, signMessageAsync } = useSignMessage();

  const { data: signer } = useSigner();

  const [isNotSupported, setSupport] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(false);
  const handleClose = () => setOpen(false);
  const [failMessage, setFailMessage] = useState<string>('');
  
  const [userAddress, setUserAddress] = useState<string>('');
  



  const [name, setName] = useState<string>('');
  const [des, setDes] = useState<string>('');
  const [contractAd, setContractAd] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [part, setPart] = useState<string>("");
  const [bigLoader, setBigLoader] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const useClose = () => setShowModal(false)


  let nft:any = "";

  const generateNftData = async (name: string, owner: string, desc?: string) => {

    const nfx = makeNFTClient(process.env.NEXT_PUBLIC_NFT_KEY || ""); 

    const date = new Date();
    
    await fetch(bgLogo.src).then(async (x) => {
      nft = await nfx.store({
        image: new File([await x.blob()], "clover.png", {
          type: "image/png",
        }),
        name,
        description: `${
          desc === undefined
            ? `Access to ${name} ${
                name.toLowerCase().indexOf("dao") == -1 ? "DAO" : ""
              }`
            : desc
        }`,
        attributes: [
          {
            main: owner,
            created: Math.floor(date.getTime() / 1000),
          },
        ],
      });
    });
    return nft.url;
  };

  const mintNFT = async (tokenURI: string, receiver: string) => {


     const provider = new ethers.providers.JsonRpcProvider(
       "https://api.hyperspace.node.glif.io/rpc/v1"
     );

    console.log(receiver);

    try{
      
      const signer = new ethers.Wallet(process.env.NEXT_PUBLIC_MATIC_PRIVATE_KEY || '', provider);

      const token = new ethers.Contract(contractAddress, abi, signer);


      const receipt = await token.mintTokens(
        receiver,
        tokenURI
      );

      console.log(receipt);

      return "continue";

    }catch(err){

      console.log(err)

    }
  };

  

  const [updatex, setUpdatex] = useState<{
    name?: string,
    contract?: string,
    main?: string,
    table?:string 
  }>({});




  const sumitDeets = async () => {
      setLoading(true)
      
      let send: boolean = false; 
      
      if (!isConnected) {
        await connectAsync({ connector: connectors[0] });
      }


     try{      

      const signedHash = await signMessageAsync({
              message: "Registering A DAO",
          });


      const userAddress: string = address as `0x${string}`;


      if (!name.length) {
        setFailMessage("Name is required"); 
        setLoading(false);         
        return;
      }

      if(des.length > 300){
        setFailMessage("Description requires a max of 300 characters");
        setLoading(false);
        return;
      }

      if (!contractAd.length) {
        setFailMessage(
          "A contract address is required if you dont have one leave as default"
        );
        setLoading(false);
        return;
      } else if (contractAd.toLowerCase().trim() == "default") {
        if (participants.length) {
          participants.forEach(async (v) => {
            if (!ethers.utils.isAddress(v)) {
              setLoading(false);
              setFailMessage(
                `Error Retrieving data from ${v}, check the address and try again`
              );
              return;
            } else {
              console.log("works");
            }
          });
        }

        send = true;
        console.log("default herex");

        // send nft to dao

        

      } else {

        const provider = new ethers.providers.JsonRpcProvider(
          "https://api.hyperspace.node.glif.io/rpc/v1"
        );

        const token = new ethers.Contract(contractAd, balanceABI, provider);

        const balance = await token.getBalance(address);

        const active = balance > 0;

        if (!active) {
          setLoading(false);
          setFailMessage("Your contract address does not exist in your wallet");
          return;
        }

        send = true;
      }

        const nftown: string[] = participants;

        try {
          const dbData = await get(child(ref(db), "DAOs"));

          const idMain = dbData.exists()
            ? (dbData.val().length || dbData.val().length - 1)
            : 0;


          const rand = `CF${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 999)}`;

          const payload: any = {
            contract : (contractAd.toLowerCase()).trim() == 'default' ? contractAddress : contractAd,
            joined: participants,
            desc: des || '',
            name,
            randId: rand
          }
          

          if (contractAd.toLowerCase().trim() == "default") {
            nftown.push(userAddress);
            const metadata = await generateNftData(
              name,
              userAddress,
              des.length ? des : undefined
            );

            for (let i = 0; i < nftown.length; i++) {
              const trans = await mintNFT(metadata, nftown[i]);
            }

            payload['metadata'] = userAddress;

            await set(ref(db, `DAOs/${idMain}`), payload);

              
              localStorage.setItem(
                "cloverlog",
                JSON.stringify({
                  id: idMain,
                  name,
                  contract: contractAddress,
                  data: rand,
                  participants
                })
              );

              notifications({ title: `You were added to ${name} on clover`, message: 'click me to log in to your DAO', exclude: userAddress, receivers: participants });
            
            
          } else {

            
            await set(ref(db, `DAOs/${idMain}`), payload);
              

              localStorage.setItem(
                "cloverlog",
                JSON.stringify({
                  id: idMain,
                  name,
                  contract: contractAd,
                  data: rand,
                  participants: [address]         
                })
              );  
          }

          Router.push("/dashboard");
        } catch (err) {
          setLoading(false);
          console.log(err);
          setFailMessage("Something went wrong, please try again");
        }

       } catch(err) {
        const error = err as Error;

        console.log(error)
        setLoading(false);
          setFailMessage("Something went wrong, please try again")
       }

  }

  
  const [exec, setExec] = useState<object[]>([]);

  const login = async () => {

    setLoginError('');
    setBigLoader(true)

    setExec([]);

      setSupport(false)
  
      try {

        const provider = new ethers.providers.JsonRpcProvider("https://api.hyperspace.node.glif.io/rpc/v1");

          let add: any;  

          if(!isConnected){

            add = await connectAsync({ connector: connectors[0] });

          }
        
          const signedHash = await signMessageAsync({ message: 'Welcome back to Kutumb' });


            console.log('connected');

            const userAddress:string = address as `0x${string}`;
            
            console.log(add, userAddress, signedHash);

            try {
            
            
        const validateAddress = ethers.utils.verifyMessage(
          "Welcome back to Kutumb",
          signedHash
        );

        if (
          validateAddress.toLowerCase() ==
          (add?.account || userAddress).toLowerCase()
        ) {
          get(child(ref(db), "DAOs"))
            .then(async (data) => {
              if (data.exists()) {

                const dao = data.val().filter((a: any) => a.contract);

                const sdao = [];

                if (dao.length) {
                  for (let i = 0; i < dao.length; i++) {
                    if (dao[i].contract.toLowerCase() == contractAddress) {
                      const { joined } = dao[i];

                      joined.forEach((val: string) => {
                        if (
                          val.toLowerCase() ==
                          (add?.account || userAddress).toLowerCase()
                        ) {
                          sdao.push({ ...dao[i], id: i });
                        }
                      });
                    } else {
                      const token = new ethers.Contract(
                        dao[i].contract,
                        balanceABI,
                        provider
                      );

                      const balance = ethers.utils.formatEther(
                        await token.balanceOf(address)
                      );

                      if (Number(balance) > 0) {
                        sdao.push({ ...dao[i], id: i });
                      }
                    }
                  }
                }

            if (sdao.length) {
                 

            if (sdao.length > 1) {

              setExec([...sdao]);

              setShowModal(true);

              setBigLoader(false);

            } else {

              console.log("xxv.2");
              const vv: any = sdao[0];

              const name: string = vv.name;
              const contract: string = vv.contract;
              const data:string = vv.randId;

              const joined:boolean = vv.joined.indexOf(userAddress) == -1; 
              
              let list: any[] = [];

              if (joined) {

                list = [ ...vv.joined, userAddress ];

                  const query = ref(db, `DAOs/${vv.id}/joined`);

                  await update(query, list);


              }else{
                console.log(userAddress, vv.joined)
              }


              localStorage.setItem(
                "cloverlog",
                JSON.stringify({
                  id: vv.id,
                  name,
                  contract,
                  data,
                  participants: list.length ? list : vv.joined
                })
              );
              

              Router.push("/dashboard");

            }

                } else {
                   setBigLoader(false);
                   setSupport(false);
                   setLoginError("No registered daos found");
                   return;
                }
              } else {
                setBigLoader(false);
                setSupport(false);
                setLoginError("No registered daos found");
                return;
              }
            })
            .catch((err) => {

              console.log(err)
              setBigLoader(false);
              setSupport(false);
              setLoginError("Something went wrong please try again");
              return;
            });
        } else {
          setBigLoader(false);
          setSupport(false);
          setLoginError("Invalid Address");

          return;
        }


            } catch (err) {

              const error = err as any;

              setBigLoader(false);
              setSupport(false);
              setLoginError(error.response.data.message || error.message);

            }


        }catch (err) {

          const error = err as Error

          setBigLoader(false);
          setLoginError(error.message);

        }
  };


  return (
    <>

      <div>
        {/* <div className="cs-preloader cs-center">
          <div className="cs-preloader_in" />
        </div> */}
        {/* Start Header Section */}
        <header className="cs-site_header cs-style1 text-uppercase cs-sticky_header">
          <div className="cs-main_header">
            <div className="container">
              <div className="cs-main_header_in">
                <div className="cs-main_header_left">
                  <a className="cs-site_branding" href="">
                    <Image src={ku_logo} alt="Logo" />
                  </a>
                </div>
                <div className="cs-main_header_center">
                  <div className="cs-nav cs-primary_font cs-medium">
                    {/* <ul className="cs-nav_list">
                      <li>
                        <a href="index.html">Home</a>
                      </li>
                      <li>
                        <a href="about.html">About</a>
                      </li>
                      <li>
                      <a href="contact.html">Contact</a>
                      </li>
                      
                    </ul> */}
                  </div>
                </div>
                <div className="cs-main_header_right">
                <Button
                  onClick={login}
                  style={{
                    fontFamily: "Poppins",
                  }}
                  className="!py-3 !px-6 rounded-lg !capitalize !font-semibold !text-m !text-white !bg-[#0ed1a4]"
                >
                  Connect Wallet
                </Button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="cs-side_header">
          <button className="cs-close" />
          <div className="cs-side_header_overlay" />
          <div className="cs-side_header_in">
            <div className="cs-side_header_shape" />
            <a className="cs-site_branding" href="index.html">
              <img src="assets/img/footer_logo.svg" alt="Logo" />
            </a>
            <div className="cs-side_header_box">
              <h2 className="cs-side_header_heading"> Do you have a project in your <br /> mind? Keep connect us. </h2>
            </div>
            <div className="cs-side_header_box">
              <h3 className="cs-side_header_title cs-primary_color">Contact Us</h3>
              <ul className="cs-contact_info cs-style1 cs-mp0">
                <li>
                  <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 12.5C15.75 12.5 14.55 12.3 13.43 11.93C13.08 11.82 12.69 11.9 12.41 12.17L10.21 14.37C7.38 12.93 5.06 10.62 3.62 7.79L5.82 5.58C6.1 5.31 6.18 4.92 6.07 4.57C5.7 3.45 5.5 2.25 5.5 1C5.5 0.45 5.05 0 4.5 0H1C0.45 0 0 0.45 0 1C0 10.39 7.61 18 17 18C17.55 18 18 17.55 18 17V13.5C18 12.95 17.55 12.5 17 12.5ZM9 0V10L12 7H18V0H9Z" fill="#FF4A17" />
                  </svg>
                  <span>+44 454 7800 112</span>
                </li>
                <li>
                  <svg width={20} height={18} viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6.98V16C20 17.1 19.1 18 18 18H2C0.9 18 0 17.1 0 16V4C0 2.9 0.9 2 2 2H12.1C12.04 2.32 12 2.66 12 3C12 4.48 12.65 5.79 13.67 6.71L10 9L2 4V6L10 11L15.3 7.68C15.84 7.88 16.4 8 17 8C18.13 8 19.16 7.61 20 6.98ZM14 3C14 4.66 15.34 6 17 6C18.66 6 20 4.66 20 3C20 1.34 18.66 0 17 0C15.34 0 14 1.34 14 3Z" fill="#FF4A17" />
                  </svg>
                  <span>infotech@arino.com</span>
                </li>
                <li>
                  <svg width={14} height={20} viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 20 7 20C7 20 14 12.25 14 7C14 3.13 10.87 0 7 0ZM7 9.5C5.62 9.5 4.5 8.38 4.5 7C4.5 5.62 5.62 4.5 7 4.5C8.38 4.5 9.5 5.62 9.5 7C9.5 8.38 8.38 9.5 7 9.5Z" fill="#FF4A17" />
                  </svg>
                  <span>50 Wall Street Suite, 44150 <br />Ohio, United States </span>
                </li>
              </ul>
            </div>
            <div className="cs-side_header_box">
              <h3 className="cs-side_header_title cs-primary_color">Subscribe</h3>
              <div className="cs-newsletter cs-style1">
                <form action="#" className="cs-newsletter_form">
                  <input type="email" className="cs-newsletter_input" placeholder="example@gmail.com" />
                  <button className="cs-newsletter_btn">
                    <span>Send</span>
                  </button>
                </form>
                <div className="cs-newsletter_text"> At vero eos et accusamus et iusto odio as part dignissimos ducimus qui blandit. </div>
              </div>
            </div>
            <div className="cs-side_header_box">
              <div className="cs-social_btns cs-style1">
                <a href="#" className="cs-center">
                  <svg width={15} height={15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.04799 13.7497H1.45647V5.4043H4.04799V13.7497ZM2.75084 4.2659C1.92215 4.2659 1.25 3.57952 1.25 2.75084C1.25 2.35279 1.40812 1.97105 1.68958 1.68958C1.97105 1.40812 2.35279 1.25 2.75084 1.25C3.14888 1.25 3.53063 1.40812 3.81209 1.68958C4.09355 1.97105 4.25167 2.35279 4.25167 2.75084C4.25167 3.57952 3.57924 4.2659 2.75084 4.2659ZM13.7472 13.7497H11.1613V9.68722C11.1613 8.71903 11.1417 7.4774 9.81389 7.4774C8.46652 7.4774 8.26004 8.5293 8.26004 9.61747V13.7497H5.67132V5.4043H8.15681V6.54269H8.19308C8.53906 5.887 9.38421 5.19503 10.6451 5.19503C13.2679 5.19503 13.75 6.92215 13.75 9.16546V13.7497H13.7472Z" fill="white" />
                  </svg>
                </a>
                <a href="#" className="cs-center">
                  <svg width={13} height={11} viewBox="0 0 13 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4651 2.95396C11.4731 3.065 11.4731 3.17606 11.4731 3.2871C11.4731 6.67383 8.89535 10.5761 4.18402 10.5761C2.73255 10.5761 1.38421 10.1557 0.25 9.42608C0.456226 9.44986 0.654494 9.4578 0.868655 9.4578C2.06629 9.4578 3.16879 9.0533 4.04918 8.36326C2.92291 8.33946 1.97906 7.60183 1.65386 6.5866C1.81251 6.61038 1.97112 6.62624 2.1377 6.62624C2.36771 6.62624 2.59774 6.59451 2.81188 6.53901C1.63802 6.30105 0.757595 5.26996 0.757595 4.02472V3.99301C1.09864 4.18336 1.49524 4.30233 1.91558 4.31818C1.22554 3.85814 0.773464 3.07294 0.773464 2.1846C0.773464 1.70872 0.900344 1.27249 1.12244 0.891774C2.38355 2.44635 4.27919 3.46156 6.40481 3.57262C6.36516 3.38226 6.34136 3.184 6.34136 2.9857C6.34136 1.57388 7.4835 0.423828 8.90323 0.423828C9.64086 0.423828 10.3071 0.733156 10.7751 1.23284C11.354 1.1218 11.9093 0.907643 12.401 0.614185C12.2106 1.20906 11.8061 1.70875 11.2748 2.02598C11.7903 1.97049 12.29 1.82769 12.75 1.62942C12.4011 2.13702 11.9648 2.5891 11.4651 2.95396V2.95396Z" fill="white" />
                  </svg>
                </a>
                <a href="#" className="cs-center">
                  <svg width={13} height={9} viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.4888 1.48066C12.345 0.939353 11.9215 0.513038 11.3837 0.368362C10.4089 0.105469 6.5 0.105469 6.5 0.105469C6.5 0.105469 2.59116 0.105469 1.61633 0.368362C1.07853 0.513061 0.65496 0.939353 0.5112 1.48066C0.25 2.4618 0.25 4.50887 0.25 4.50887C0.25 4.50887 0.25 6.55595 0.5112 7.53709C0.65496 8.0784 1.07853 8.48695 1.61633 8.63163C2.59116 8.89452 6.5 8.89452 6.5 8.89452C6.5 8.89452 10.4088 8.89452 11.3837 8.63163C11.9215 8.48695 12.345 8.0784 12.4888 7.53709C12.75 6.55595 12.75 4.50887 12.75 4.50887C12.75 4.50887 12.75 2.4618 12.4888 1.48066V1.48066ZM5.22158 6.36746V2.65029L8.48861 4.50892L5.22158 6.36746V6.36746Z" fill="white" />
                  </svg>
                </a>
                <a href="#" className="cs-center">
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.87612 8.149C2.87612 8.87165 2.28571 9.46205 1.56306 9.46205C0.840402 9.46205 0.25 8.87165 0.25 8.149C0.25 7.42634 0.840402 6.83594 1.56306 6.83594H2.87612V8.149ZM3.53795 8.149C3.53795 7.42634 4.12835 6.83594 4.851 6.83594C5.57366 6.83594 6.16406 7.42634 6.16406 8.149V11.4369C6.16406 12.1596 5.57366 12.75 4.851 12.75C4.12835 12.75 3.53795 12.1596 3.53795 11.4369V8.149ZM4.851 2.87612C4.12835 2.87612 3.53795 2.28571 3.53795 1.56306C3.53795 0.840402 4.12835 0.25 4.851 0.25C5.57366 0.25 6.16406 0.840402 6.16406 1.56306V2.87612H4.851V2.87612ZM4.851 3.53795C5.57366 3.53795 6.16406 4.12835 6.16406 4.851C6.16406 5.57366 5.57366 6.16406 4.851 6.16406H1.56306C0.840402 6.16406 0.25 5.57366 0.25 4.851C0.25 4.12835 0.840402 3.53795 1.56306 3.53795H4.851V3.53795ZM10.1239 4.851C10.1239 4.12835 10.7143 3.53795 11.4369 3.53795C12.1596 3.53795 12.75 4.12835 12.75 4.851C12.75 5.57366 12.1596 6.16406 11.4369 6.16406H10.1239V4.851V4.851ZM9.46205 4.851C9.46205 5.57366 8.87165 6.16406 8.149 6.16406C7.42634 6.16406 6.83594 5.57366 6.83594 4.851V1.56306C6.83594 0.840402 7.42634 0.25 8.149 0.25C8.87165 0.25 9.46205 0.840402 9.46205 1.56306V4.851V4.851ZM8.149 10.1239C8.87165 10.1239 9.46205 10.7143 9.46205 11.4369C9.46205 12.1596 8.87165 12.75 8.149 12.75C7.42634 12.75 6.83594 12.1596 6.83594 11.4369V10.1239H8.149ZM8.149 9.46205C7.42634 9.46205 6.83594 8.87165 6.83594 8.149C6.83594 7.42634 7.42634 6.83594 8.149 6.83594H11.4369C12.1596 6.83594 12.75 7.42634 12.75 8.149C12.75 8.87165 12.1596 9.46205 11.4369 9.46205H8.149Z" fill="white" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* End Header Section */}
        {/* Start Hero */}
        <div className="cs-hero cs-style1 cs-bg cs-fixed_bg cs-shape_wrap_1" data-src="assets/img/hero_bg.jpeg" id="home">
          <div className="cs-shape_1" />
          <div className="cs-shape_1" />
          <div className="cs-shape_1" />
          <div className="container">
            <div className="cs-hero_text">
              <h1 className="cs-hero_title wow fadeInRight" data-wow-duration="0.8s" data-wow-delay="0.2s"> Creativity In <br />Our Data DAO </h1>
              <div className="cs-hero_info">
                <div>
                <Button
                  onClick={() => setOpen(true)}
                  style={{
                    fontFamily: "Poppins",
                  }}
                  className="!py-4 !px-8 rounded-lg !capitalize !font-semibold !text-m !text-white !bg-[#0ed1a4]"
                >
                  Create
                </Button>
                </div>
                <div>
                  <div className="cs-hero_subtitle"> Revolutionize your DAO team communication with our multi-channel team communication, seamless file sharing, streamings and more, all in one platform. </div>
                </div>
              </div>
            </div>
          </div>
          <a href="#service" className="cs-down_btn" />
        </div>
        {/* End Hero */}
        {/* Start Service Section */}
        <section id="service">
          <div className="cs-height_150 cs-height_lg_80" />
          <div className="container">
            <div className="row">
              <div className="col-xl-4">
                <div className="cs-section_heading cs-style1">
                  <h3 className="cs-section_subtitle">What Can We Do</h3>
                  <h2 className="cs-section_title">Services we can help you with</h2>
                  <div className="cs-height_45 cs-height_lg_20" />

                </div>
                <div className="cs-height_90 cs-height_lg_45" />
              </div>
              <div className="col-xl-8">
                <div className="row">
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="" className="cs-card cs-style1 cs-hover_layer1">
                        <Image src={myService1} alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">Broadcast</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="" className="cs-card cs-style1 cs-hover_layer1">
                      <Image src={myService2} alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">DAO Storage</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="" className="cs-card cs-style1 cs-hover_layer1">
                      <Image src={myService3} alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">Live Streaming</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="" className="cs-card cs-style1 cs-hover_layer1">
                      <Image src={myService4} alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">Goveranance</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                </div>
              </div>
            </div>
          </div>
          <div className="cs-height_150 cs-height_lg_50" />
        </section>
        {/* End Service Section */}
        
        <div className="cs-height_130 cs-height_lg_70" />
        
        <div className="cs-height_145 cs-height_lg_80" />
        {/* Start Team Section */}
        <section>
          <div className="container">
            <div className="cs-slider cs-style2 cs-gap-24">
              <div className="cs-slider_heading cs-style1">
                <div className="cs-section_heading cs-style1">
                  <h3 className="cs-section_subtitle wow fadeInLeft" data-wow-duration="0.8s" data-wow-delay="0.2s"> Our Team </h3>
                  <h2 className="cs-section_title">Awesome team <br />members </h2>
                </div>
                <div className="cs-slider_arrows cs-style1 cs-primary_color">
                  <div className="cs-left_arrow cs-center">
                    <svg width={26} height={13} viewBox="0 0 26 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.469791 5.96967C0.176899 6.26256 0.176899 6.73744 0.469791 7.03033L5.24276 11.8033C5.53566 12.0962 6.01053 12.0962 6.30342 11.8033C6.59632 11.5104 6.59632 11.0355 6.30342 10.7426L2.06078 6.5L6.30342 2.25736C6.59632 1.96447 6.59632 1.48959 6.30342 1.1967C6.01053 0.903806 5.53566 0.903806 5.24276 1.1967L0.469791 5.96967ZM26.0001 5.75L1.00012 5.75V7.25L26.0001 7.25V5.75Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="cs-right_arrow cs-center">
                    <svg width={26} height={13} viewBox="0 0 26 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25.5305 7.03033C25.8233 6.73744 25.8233 6.26256 25.5305 5.96967L20.7575 1.1967C20.4646 0.903806 19.9897 0.903806 19.6968 1.1967C19.4039 1.48959 19.4039 1.96447 19.6968 2.25736L23.9395 6.5L19.6968 10.7426C19.4039 11.0355 19.4039 11.5104 19.6968 11.8033C19.9897 12.0962 20.4646 12.0962 20.7575 11.8033L25.5305 7.03033ZM0.00012207 7.25H25.0001V5.75H0.00012207V7.25Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="cs-height_85 cs-height_lg_45" />
              <div className="cs-slider_container" data-autoplay={0} data-loop={1} data-speed={600} data-center={0} data-slides-per-view="responsive" data-xs-slides={1} data-sm-slides={2} data-md-slides={3} data-lg-slides={4} data-add-slides={4}>
                <div className="cs-slider_wrapper">
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                      <Image className='team_members' src={divyanshu} alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="">Divayanshu Urmaliya</a>
                        </h2>
                        <div className="cs-member_designation">Backend Developer</div>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <Image className='team_members' src={my_img} alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="">Sumit Choudhary</a>
                        </h2>
                        <div className="cs-member_designation">Frontend Devloper</div>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <Image className='team_members' src={harsh_sir} alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="">Harsh Vishwakarma</a>
                        </h2>
                        <div className="cs-member_designation">Frontend Devloper</div>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <Image className='team_members' src={harsh_sir} alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="">Aman Kushwaha</a>
                        </h2>
                        <div className="cs-member_designation">Backend Developer</div>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <Image className='team_members' src={harsh_sir} alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="">Ankur gupta</a>
                        </h2>
                        <div className="cs-member_designation">Backend Developer</div>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                </div>
              </div>
              {/* .cs-slider_container */}
              <div className="cs-pagination cs-style1 cs-hidden_desktop" />
            </div>
            {/* .cs-slider */}
          </div>
        </section>
        {/* End Team Section */}
        <div className="cs-height_150 cs-height_lg_80" />
        
        
        {/* End Moving Text */}
        <div className="cs-moving_text_wrap cs-bold cs-primary_font">
          <div className="cs-moving_text_in">
            <div className="cs-moving_text" >Secure transactions with our trusted network</div>
            {/* <div className="cs-moving_text">Secure transactions with our trusted network</div> */}
          </div>
        </div>
        
        <div className="cs-height_130 cs-height_lg_70" />
        {/* Start CTA */}
        <section>
          <div className="container">
            <div className="cs-cta cs-style1 cs-bg text-center cs-shape_wrap_1 cs-position_1" data-src="assets/img/cta_bg.jpeg">
              <div className="cs-shape_1" />
              <div className="cs-shape_1" />
              <div className="cs-shape_1" />
              <div className="cs-cta_in">
                <h2 className="cs-cta_title cs-semi_bold cs-m0"> Let’s disscuse make <br />something <i>cool</i> together </h2>
                <div className="cs-height_70 cs-height_lg_30" />
                
              </div>
            </div>
          </div>
        </section>
        {/* End CTA */}
        
        
        {/* Script */}
      </div>

      {bigLoader && <Loader />}

      {!bigLoader && (
        <div className={styles.container}>
          <Head>
            <title>Kutumb</title>
            
          </Head>

          {showModal ? (
            <div className={`justify-center bg-[rgba(255,255,255,.4)] mt-[74px] flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none`}>
              
              <div className="relative max-w-[1500px] w-[80%] 4sm:w-[60%] min-w-[340px]">
                {/*content*/}
                <div className="border-0 rounded-[12px] shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">

                  <div className="flex items-center justify-center pb-2 pt-3 border-solid rounded-t">
                    <h2
                      style={{ fontFamily: "inherit" }}
                      className="text-[18px] font-bold"
                    >
                      Choose DAO
                    </h2>
                  </div>
                  {/*body*/}
                  {/* {Boolean(authError?.length) && (
                    <div className="transition-all rounded-md delay-500 border-[#1891fe] text-[#1891fe] items-center font-bold text-[16px] border-[1px] mx-6 my-2 w-[calc(100%-48px)] p-3">
                      {authError}
                    </div>
                  )} */}

                  <div
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(320px, 1fr))",
                    }}
                    className="relative p-6 grid gap-2 grid-flow-dense"
                  >
                    {exec.map((vv: any, i: number) => (
                      <button
                        key={i}
                        onClick={async () => {
                          const name: string = vv.name;
                          const contract: string = vv.contract;
                          const data: string = vv.randId;

                          localStorage.setItem(
                            "cloverlog",
                            JSON.stringify({
                              id: vv.id,
                              name,
                              contract,
                              data,
                              participants: vv.joined,
                            })
                          );

                          Router.push("/dashboard");
                        }}
                        style={{ fontFamily: "inherit" }}
                        className="transition-all rounded-md delay-500 hover:border-[#1891fe] hover:text-[#1891fe] items-start text-[16px] flex justify-between border-[1px] 4sm:mr-2 text-[#575757] mb-2 w-full py-4 px-4"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-bold">{vv.name}</span>
                          <span className="text-left">{vv.desc}</span>
                        </div>
                        
                      </button>
                    ))}
                  </div>
                  {/*footer*/}
                  <div className="flex items-center justify-end p-2 border-t border-solid border-slate-200 rounded-b">
                    <button
                      className="text-blue-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={useClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <Modal open={open} onClose={handleClose}>
            <div className="w-screen overflow-y-scroll overflow-x-hidden absolute h-screen flex items-center bg-[#ffffff40]">
              <div className="2usm:px-0 mx-auto max-w-[900px] 2usm:w-full relative w-[85%] usm:m-auto min-w-[340px] px-6 my-8 items-center ">
                {isLoading && (
                  <Loader
                    sx={{
                      backgroundColor: "rgba(255,255,255,.6)",
                      backdropFilter: "blur(5px)",
                    }}
                    fixed={false}
                    incLogo={false}
                  />
                )}

                <div className="rounded-lg shadow-lg shadow-[#cccccc] modal-dark">
                  <div className="border-b flex justify-between py-[14px] px-[17px] text-xl font-bold">
                    Register DAO
                    <BiX
                      size={20}
                      className="cursor-pointer"
                      onClick={handleClose}
                    />
                  </div>
                  <div className="form relative pt-4">
                    <Box sx={{ width: "100%" }}>
                      {Boolean(failMessage.length) && (
                        <div className="rounded-md w-[95%] font-bold mt-2 mx-auto p-3 bg-[#ff8f33] text-white">
                          {failMessage}
                        </div>
                      )}

                      <FormControl
                        fullWidth
                        sx={{
                          px: 5,
                          py: 3,
                        }}
                      >
                        <div>
                          <TextField
                            fullWidth
                            id="outlined-basic"
                            label="Name of DAO"
                            variant="outlined"
                            value={name}
                            onChange={(
                              e: React.ChangeEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >
                            ) => {
                              setName(e.target.value);
                            }}
                          />
                        </div>
                        <div className="mt-3">
                          <TextField
                            fullWidth
                            id="outlined-basic"
                            label="Description of DAO"
                            variant="outlined"
                            helperText="Short Description Of DAO, Can be left empty - max 300 characters"
                            value={des}
                            onChange={(
                              e: React.ChangeEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >
                            ) => {
                              const val = e.target.value;

                              setDes(val.substring(0, 300));
                            }}
                          />
                        </div>
                        <div className="my-3">
                          <TextField
                            fullWidth
                            id="outlined-basic"
                            label="Contract Address"
                            variant="outlined"
                            helperText="Contract address of the token that would allow users into the DAO - use `default` if you want one generated by us"
                            value={contractAd}
                            onChange={(
                              e: React.ChangeEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >
                            ) => {
                              setContractAd(e.target.value);
                            }}
                          />
                        </div>

                        {contractAd.toLowerCase().trim() == "default" && (
                          <>
                            <div className="py-3 font-bold">Participants</div>
                            <div className="flex w-full my-2 cusscroller overflow-hidden overflow-x-scroll items-center">
                              {participants.map((e, i: number) => (
                                <div
                                  className="border text-[#777] border-solid ml-[2px] rounded p-2"
                                  key={i}
                                >
                                  {e.substring(0, 5) +
                                    "...." +
                                    e.substring(e.length - 5, e.length)}
                                </div>
                              ))}
                            </div>

                            <TextField
                              fullWidth
                              id="outlined-basic"
                              helperText="if left empty, only you would have access to the DAO"
                              variant="outlined"
                              value={part}
                              placeholder="click enter to add address"
                              onChange={(e: any) => {
                                setPart(e.target.value);
                              }}
                              onKeyUp={(e: any) => {
                                setPart(e.target.value);

                                if (e.keyCode == 13 || e.which === 13) {
                                  if (part.length) {
                                    const partx: string[] = participants;
                                    partx.push(part);

                                    setParticipants(partx);

                                    setPart("");
                                  }
                                }
                              }}
                              onBlur={(e: any) => {
                                setPart(e.target.value);
                                if (part.length) {
                                  const partx: string[] = participants;
                                  partx.push(part);
                                  setParticipants(partx);
                                  setPart("");
                                }
                              }}
                            />
                          </>
                        )}

                        <Button
                          variant="contained"
                          className="!bg-[#1891fe] !mt-4 !py-[13px] !font-medium !capitalize"
                          style={{
                            fontFamily: "inherit",
                          }}
                          onClick={() => {
                            setFailMessage("");
                            sumitDeets();
                          }}
                          fullWidth
                        >
                          Create
                        </Button>
                      </FormControl>
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          </Modal>

          {/* <div className="h-screen flex flex-col justify-center">
            {Boolean(loginError.length) && (
              <Alert className="my-2" severity="error">
                {loginError}
              </Alert>
            )}
          </div> */}
        </div>
      )}
    </>
  );
}

export default Home
