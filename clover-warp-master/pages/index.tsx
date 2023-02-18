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
        
          const signedHash = await signMessageAsync({ message: 'Welcome back to clover' });


            console.log('connected');

            const userAddress:string = address as `0x${string}`;
            
            console.log(add, userAddress, signedHash);

            try {
            
            
        const validateAddress = ethers.utils.verifyMessage(
          "Welcome back to clover",
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
                  <a className="cs-site_branding" href="index.html">
                    <img src="assets/img/logo.svg" alt="Logo" />
                  </a>
                </div>
                <div className="cs-main_header_center">
                  <div className="cs-nav cs-primary_font cs-medium">
                    <ul className="cs-nav_list">
                      <li className="menu-item-has-children cs-mega_menu">
                        <a href="index.html">Home</a>
                        <ul className="cs-mega_wrapper">
                          <li>
                            <ul>
                              <li>
                                <a href="index.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/main-home.jpeg" alt="" />
                                </a>
                                <a href="index.html">Main Home</a>
                              </li>
                              <li>
                                <a href="showcase-portfolio.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/showcase.jpeg" alt="" />
                                </a>
                                <a href="showcase-portfolio.html">Showcase Portfolio</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <ul>
                              <li>
                                <a href="photography-agency.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/photography-agency.jpeg" alt="" />
                                </a>
                                <a href="photography-agency.html">Photography Agency</a>
                              </li>
                              <li>
                                <a href="case-study-showcase.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/case_study_showcase.jpeg" alt="" />
                                </a>
                                <a href="case-study-showcase.html">Case Study Showcase</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <ul>
                              <li>
                                <a href="creative-portfolio.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/portfolio.jpeg" alt="" />
                                </a>
                                <a href="creative-portfolio.html">Creative Portfolio</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <ul>
                              <li>
                                <a href="digital-agency.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/digital-agency.jpeg" alt="" />
                                </a>
                                <a href="digital-agency.html">Digital Agency</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <ul>
                              <li>
                                <a href="marketing-agency.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/marketing.jpeg" alt="" />
                                </a>
                                <a href="marketing-agency.html">Marketing Agency</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <ul>
                              <li>
                                <a href="freelancer-agency.html" className="cs-nav_list_img">
                                  <img src="assets/img/demo/freelancer-agency.jpeg" alt="" />
                                  <span className="cs-header_badge">New</span>
                                </a>
                                <a href="freelancer-agency.html">Freelancing Agency</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <ul>
                              <li>
                                <a href="https://arino-html-rtl.vercel.app/" target="_blank" className="cs-nav_list_img">
                                  <img src="assets/img/demo/rtl.jpeg" alt="" />
                                  <span className="cs-header_badge">New</span>
                                </a>
                                <a href="https://arino-html-rtl.vercel.app/" target="_blank">RTL Demo</a>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li>
                        <a href="about.html">About</a>
                      </li>
                      <li className="menu-item-has-children">
                        <a href="service.html">Services</a>
                        <ul>
                          <li>
                            <a href="service.html">Services</a>
                          </li>
                          <li>
                            <a href="service-details.html">Service Details</a>
                          </li>
                        </ul>
                      </li>
                      <li className="menu-item-has-children">
                        <a href="portfolio.html">Portfolio</a>
                        <ul>
                          <li>
                            <a href="portfolio.html">Portfolio</a>
                          </li>
                          <li>
                            <a href="portfolio-details.html">Portfolio Details</a>
                          </li>
                        </ul>
                      </li>
                      <li className="menu-item-has-children">
                        <a href="blog.html">Blog</a>
                        <ul>
                          <li>
                            <a href="blog.html">Blog</a>
                          </li>
                          <li>
                            <a href="blog-details.html">Blog Details</a>
                          </li>
                        </ul>
                      </li>
                      <li className="menu-item-has-children">
                        <a href="#">Pages</a>
                        <ul>
                          <li>
                            <a href="contact.html">Contact</a>
                          </li>
                          <li>
                            <a href="team.html">Team</a>
                          </li>
                          <li>
                            <a href="team-details.html">Team Details</a>
                          </li>
                          <li>
                            <a href="case-study.html">Case Study Details</a>
                          </li>
                          <li>
                            <a href="faq.html">FAQ</a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="cs-main_header_right">
                  <div className="cs-toolbox">
                    <span className="cs-icon_btn">
                      <span className="cs-icon_btn_in">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                    </span>
                  </div>
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
              <h1 className="cs-hero_title wow fadeInRight" data-wow-duration="0.8s" data-wow-delay="0.2s"> Creativity In <br />Our Blood Line </h1>
              <div className="cs-hero_info">
                <div>
                  <a href="contact.html" className="cs-text_btn">
                    <span>Get a Quote</span>
                    <svg width={26} height={12} viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25.5303 6.53033C25.8232 6.23744 25.8232 5.76256 25.5303 5.46967L20.7574 0.696699C20.4645 0.403806 19.9896 0.403806 19.6967 0.696699C19.4038 0.989593 19.4038 1.46447 19.6967 1.75736L23.9393 6L19.6967 10.2426C19.4038 10.5355 19.4038 11.0104 19.6967 11.3033C19.9896 11.5962 20.4645 11.5962 20.7574 11.3033L25.5303 6.53033ZM0 6.75H25V5.25H0V6.75Z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
                <div>
                  <div className="cs-hero_subtitle"> We deliver best problem solving solution for our client and provide finest finishing product in present and upcoming future. </div>
                </div>
              </div>
            </div>
          </div>
          <div className="cs-hero_social_wrap cs-primary_font cs-primary_color">
            <div className="cs-hero_social_title">Follow Us</div>
            <ul className="cs-hero_social_links">
              <li>
                <a href="#">Behance</a>
              </li>
              <li>
                <a href="#">Twitter</a>
              </li>
            </ul>
          </div>
          <a href="#service" className="cs-down_btn" />
        </div>
        {/* End Hero */}
        
        {/* End FunFact */}
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
                  <a href="service.html" className="cs-text_btn wow fadeInLeft" data-wow-duration="0.8s" data-wow-delay="0.2s">
                    <span>See All Services</span>
                    <svg width={26} height={12} viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25.5303 6.53033C25.8232 6.23744 25.8232 5.76256 25.5303 5.46967L20.7574 0.696699C20.4645 0.403806 19.9896 0.403806 19.6967 0.696699C19.4038 0.989593 19.4038 1.46447 19.6967 1.75736L23.9393 6L19.6967 10.2426C19.4038 10.5355 19.4038 11.0104 19.6967 11.3033C19.9896 11.5962 20.4645 11.5962 20.7574 11.3033L25.5303 6.53033ZM0 6.75H25V5.25H0V6.75Z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
                <div className="cs-height_90 cs-height_lg_45" />
              </div>
              <div className="col-xl-8">
                <div className="row">
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="service-details.html" className="cs-card cs-style1 cs-hover_layer1">
                        <img src="assets/img/service_1.jpeg" alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">UI/UX design</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="service-details.html" className="cs-card cs-style1 cs-hover_layer1">
                        <img src="assets/img/service_2.jpeg" alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">React.js Development</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="service-details.html" className="cs-card cs-style1 cs-hover_layer1">
                        <img src="assets/img/service_3.jpeg" alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">Digital Marketing</h2>
                        </div>
                      </a>
                    </div>
                    <div className="cs-height_0 cs-height_lg_30" />
                  </div>
                  <div className="col-lg-3 col-sm-6 cs-hidden_mobile" />
                  <div className="col-lg-3 col-sm-6">
                    <div className="cs-hobble">
                      <a href="service-details.html" className="cs-card cs-style1 cs-hover_layer1">
                        <img src="assets/img/service_4.jpeg" alt="Service" />
                        <div className="cs-card_overlay" />
                        <div className="cs-card_info">
                          <span className="cs-hover_layer3 cs-accent_bg" />
                          <h2 className="cs-card_title">Technology</h2>
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
        
        {/* Start Awards Text */}
        <section className="cs-shape_wrap_2">
          <div className="cs-shape_2">
            <div />
          </div>
          <div className="container">
            <div className="cs-slider cs-style1 cs-gap-24">
              <div className="cs-slider_left">
                <div className="cs-section_heading cs-style1">
                  <h3 className="cs-section_subtitle wow fadeInLeft" data-wow-duration="0.8s" data-wow-delay="0.2s"> Our Awards </h3>
                  <h2 className="cs-section_title">We get multiple awards</h2>
                </div>
                <div className="cs-height_45 cs-height_lg_20" />
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
              <div className="cs-slider_right">
                <div className="cs-slider_container" data-autoplay={0} data-loop={1} data-speed={600} data-center={0} data-slides-per-view="responsive" data-xs-slides={1} data-sm-slides={2} data-md-slides={2} data-lg-slides={2} data-add-slides={2}>
                  <div className="cs-slider_wrapper">
                    <div className="cs-slide">
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2019</h3>
                        <h2>Google awards</h2>
                        <p>Website of the day</p>
                        <p>Mobile exelence</p>
                      </div>
                      <div className="cs-height_40 cs-height_lg_30" />
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2021</h3>
                        <h2>CSS awards design</h2>
                        <p>Honorable mention</p>
                        <p>Desktop exelence</p>
                      </div>
                    </div>
                    {/* .cs-slide */}
                    <div className="cs-slide">
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2020</h3>
                        <h2>New technology innovation</h2>
                        <p>Honorable mention</p>
                        <p>Desktop exelence</p>
                      </div>
                      <div className="cs-height_40 cs-height_lg_30" />
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2022</h3>
                        <h2>UI/UX design of the month</h2>
                        <p>Website of the day</p>
                        <p>Mobile exelence</p>
                      </div>
                    </div>
                    {/* .cs-slide */}
                    <div className="cs-slide">
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2019</h3>
                        <h2>Google awards</h2>
                        <p>Website of the day</p>
                        <p>Mobile exelence</p>
                      </div>
                      <div className="cs-height_40 cs-height_lg_30" />
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2021</h3>
                        <h2>CSS awards design</h2>
                        <p>Honorable mention</p>
                        <p>Desktop exelence</p>
                      </div>
                    </div>
                    {/* .cs-slide */}
                    <div className="cs-slide">
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2020</h3>
                        <h2>New technology innovation</h2>
                        <p>Honorable mention</p>
                        <p>Desktop exelence</p>
                      </div>
                      <div className="cs-height_40 cs-height_lg_30" />
                      <div className="cs-time_line cs-style1">
                        <h3 className="cs-accent_color">2022</h3>
                        <h2>UI/UX design of the month</h2>
                        <p>Website of the day</p>
                        <p>Mobile exelence</p>
                      </div>
                    </div>
                    {/* .cs-slide */}
                  </div>
                </div>
                {/* .cs-slider_container */}
                <div className="cs-pagination cs-style1 cs-hidden_desktop" />
              </div>
            </div>
            {/* .cs-slider */}
          </div>
        </section>
        {/* End Awards Text */}
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
                        <img src="assets/img/member_1.jpeg" alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="team-details.html">Melon Bulgery</a>
                        </h2>
                        <div className="cs-member_designation">Product Designer</div>
                      </div>
                      <div className="cs-member_social cs-primary_color">
                        <a href="#">
                          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.39756 18.333H1.9422V7.20581H5.39756V18.333ZM3.66802 5.68795C2.56311 5.68795 1.6669 4.77277 1.6669 3.66786C1.6669 3.13714 1.87773 2.62814 2.25301 2.25286C2.6283 1.87758 3.13729 1.66675 3.66802 1.66675C4.19875 1.66675 4.70774 1.87758 5.08302 2.25286C5.4583 2.62814 5.66913 3.13714 5.66913 3.66786C5.66913 4.77277 4.77256 5.68795 3.66802 5.68795ZM18.3298 18.333H14.8819V12.9164C14.8819 11.6255 14.8559 9.96995 13.0854 9.96995C11.2889 9.96995 11.0136 11.3725 11.0136 12.8234V18.333H7.56199V7.20581H10.876V8.72367H10.9243C11.3857 7.84941 12.5125 6.92679 14.1937 6.92679C17.6907 6.92679 18.3336 9.22962 18.3336 12.2207V18.333H18.3298Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={14} viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.6204 3.60521C15.631 3.75325 15.631 3.90133 15.631 4.04938C15.631 8.56502 12.194 13.7681 5.91227 13.7681C3.97697 13.7681 2.17918 13.2076 0.666901 12.2347C0.941869 12.2664 1.20623 12.277 1.49177 12.277C3.08862 12.277 4.55861 11.7377 5.73248 10.8176C4.23078 10.7859 2.97231 9.80236 2.53872 8.44871C2.75024 8.48042 2.96173 8.50158 3.18384 8.50158C3.49051 8.50158 3.79722 8.45926 4.08273 8.38527C2.51759 8.06798 1.34369 6.69321 1.34369 5.03288V4.99059C1.79842 5.2444 2.32723 5.40303 2.88768 5.42416C1.96762 4.81078 1.36485 3.76383 1.36485 2.57939C1.36485 1.94488 1.53403 1.36324 1.83015 0.855618C3.51164 2.92838 6.03915 4.282 8.87331 4.43008C8.82045 4.17627 8.78871 3.91191 8.78871 3.64752C8.78871 1.76509 10.3116 0.231689 12.2045 0.231689C13.188 0.231689 14.0764 0.644126 14.7003 1.31037C15.4723 1.16232 16.2126 0.876777 16.8683 0.485499C16.6144 1.27867 16.0751 1.94491 15.3666 2.3679C16.054 2.2939 16.7202 2.10351 17.3336 1.83915C16.8683 2.51594 16.2867 3.11871 15.6204 3.60521V3.60521Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={12} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.9853 1.97421C16.7936 1.25247 16.2289 0.684051 15.5118 0.491149C14.212 0.140625 9.00023 0.140625 9.00023 0.140625C9.00023 0.140625 3.78845 0.140625 2.48868 0.491149C1.7716 0.684081 1.20685 1.25247 1.01517 1.97421C0.666901 3.28241 0.666901 6.01183 0.666901 6.01183C0.666901 6.01183 0.666901 8.74126 1.01517 10.0495C1.20685 10.7712 1.7716 11.3159 2.48868 11.5088C3.78845 11.8594 9.00023 11.8594 9.00023 11.8594C9.00023 11.8594 14.212 11.8594 15.5118 11.5088C16.2289 11.3159 16.7936 10.7712 16.9853 10.0495C17.3336 8.74126 17.3336 6.01183 17.3336 6.01183C17.3336 6.01183 17.3336 3.28241 16.9853 1.97421ZM7.29568 8.48995V3.53372L11.6517 6.01189L7.29568 8.48995Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.16839 11.1987C4.16839 12.1623 3.38119 12.9495 2.41764 12.9495C1.4541 12.9495 0.666901 12.1623 0.666901 11.1987C0.666901 10.2352 1.4541 9.448 2.41764 9.448H4.16839V11.1987ZM5.05083 11.1987C5.05083 10.2352 5.83803 9.448 6.80157 9.448C7.76511 9.448 8.55232 10.2352 8.55232 11.1987V15.5827C8.55232 16.5462 7.76511 17.3334 6.80157 17.3334C5.83803 17.3334 5.05083 16.5462 5.05083 15.5827V11.1987ZM6.80157 4.16824C5.83803 4.16824 5.05083 3.38103 5.05083 2.41749C5.05083 1.45395 5.83803 0.666748 6.80157 0.666748C7.76511 0.666748 8.55232 1.45395 8.55232 2.41749V4.16824H6.80157ZM6.80157 5.05068C7.76511 5.05068 8.55232 5.83788 8.55232 6.80142C8.55232 7.76496 7.76511 8.55217 6.80157 8.55217H2.41764C1.4541 8.55217 0.666901 7.76496 0.666901 6.80142C0.666901 5.83788 1.4541 5.05068 2.41764 5.05068H6.80157ZM13.8321 6.80142C13.8321 5.83788 14.6193 5.05068 15.5828 5.05068C16.5464 5.05068 17.3336 5.83788 17.3336 6.80142C17.3336 7.76496 16.5464 8.55217 15.5828 8.55217H13.8321V6.80142ZM12.9496 6.80142C12.9496 7.76496 12.1624 8.55217 11.1989 8.55217C10.2354 8.55217 9.44815 7.76496 9.44815 6.80142V2.41749C9.44815 1.45395 10.2354 0.666748 11.1989 0.666748C12.1624 0.666748 12.9496 1.45395 12.9496 2.41749V6.80142ZM11.1989 13.8319C12.1624 13.8319 12.9496 14.6191 12.9496 15.5827C12.9496 16.5462 12.1624 17.3334 11.1989 17.3334C10.2354 17.3334 9.44815 16.5462 9.44815 15.5827V13.8319H11.1989ZM11.1989 12.9495C10.2354 12.9495 9.44815 12.1623 9.44815 11.1987C9.44815 10.2352 10.2354 9.448 11.1989 9.448H15.5828C16.5464 9.448 17.3336 10.2352 17.3336 11.1987C17.3336 12.1623 16.5464 12.9495 15.5828 12.9495H11.1989Z" fill="currentColor" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <img src="assets/img/member_2.jpeg" alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="team-details.html">Olinaz Fushi</a>
                        </h2>
                        <div className="cs-member_designation">Project Manager</div>
                      </div>
                      <div className="cs-member_social cs-primary_color">
                        <a href="#">
                          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.39756 18.333H1.9422V7.20581H5.39756V18.333ZM3.66802 5.68795C2.56311 5.68795 1.6669 4.77277 1.6669 3.66786C1.6669 3.13714 1.87773 2.62814 2.25301 2.25286C2.6283 1.87758 3.13729 1.66675 3.66802 1.66675C4.19875 1.66675 4.70774 1.87758 5.08302 2.25286C5.4583 2.62814 5.66913 3.13714 5.66913 3.66786C5.66913 4.77277 4.77256 5.68795 3.66802 5.68795ZM18.3298 18.333H14.8819V12.9164C14.8819 11.6255 14.8559 9.96995 13.0854 9.96995C11.2889 9.96995 11.0136 11.3725 11.0136 12.8234V18.333H7.56199V7.20581H10.876V8.72367H10.9243C11.3857 7.84941 12.5125 6.92679 14.1937 6.92679C17.6907 6.92679 18.3336 9.22962 18.3336 12.2207V18.333H18.3298Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={14} viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.6204 3.60521C15.631 3.75325 15.631 3.90133 15.631 4.04938C15.631 8.56502 12.194 13.7681 5.91227 13.7681C3.97697 13.7681 2.17918 13.2076 0.666901 12.2347C0.941869 12.2664 1.20623 12.277 1.49177 12.277C3.08862 12.277 4.55861 11.7377 5.73248 10.8176C4.23078 10.7859 2.97231 9.80236 2.53872 8.44871C2.75024 8.48042 2.96173 8.50158 3.18384 8.50158C3.49051 8.50158 3.79722 8.45926 4.08273 8.38527C2.51759 8.06798 1.34369 6.69321 1.34369 5.03288V4.99059C1.79842 5.2444 2.32723 5.40303 2.88768 5.42416C1.96762 4.81078 1.36485 3.76383 1.36485 2.57939C1.36485 1.94488 1.53403 1.36324 1.83015 0.855618C3.51164 2.92838 6.03915 4.282 8.87331 4.43008C8.82045 4.17627 8.78871 3.91191 8.78871 3.64752C8.78871 1.76509 10.3116 0.231689 12.2045 0.231689C13.188 0.231689 14.0764 0.644126 14.7003 1.31037C15.4723 1.16232 16.2126 0.876777 16.8683 0.485499C16.6144 1.27867 16.0751 1.94491 15.3666 2.3679C16.054 2.2939 16.7202 2.10351 17.3336 1.83915C16.8683 2.51594 16.2867 3.11871 15.6204 3.60521V3.60521Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={12} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.9853 1.97421C16.7936 1.25247 16.2289 0.684051 15.5118 0.491149C14.212 0.140625 9.00023 0.140625 9.00023 0.140625C9.00023 0.140625 3.78845 0.140625 2.48868 0.491149C1.7716 0.684081 1.20685 1.25247 1.01517 1.97421C0.666901 3.28241 0.666901 6.01183 0.666901 6.01183C0.666901 6.01183 0.666901 8.74126 1.01517 10.0495C1.20685 10.7712 1.7716 11.3159 2.48868 11.5088C3.78845 11.8594 9.00023 11.8594 9.00023 11.8594C9.00023 11.8594 14.212 11.8594 15.5118 11.5088C16.2289 11.3159 16.7936 10.7712 16.9853 10.0495C17.3336 8.74126 17.3336 6.01183 17.3336 6.01183C17.3336 6.01183 17.3336 3.28241 16.9853 1.97421ZM7.29568 8.48995V3.53372L11.6517 6.01189L7.29568 8.48995Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.16839 11.1987C4.16839 12.1623 3.38119 12.9495 2.41764 12.9495C1.4541 12.9495 0.666901 12.1623 0.666901 11.1987C0.666901 10.2352 1.4541 9.448 2.41764 9.448H4.16839V11.1987ZM5.05083 11.1987C5.05083 10.2352 5.83803 9.448 6.80157 9.448C7.76511 9.448 8.55232 10.2352 8.55232 11.1987V15.5827C8.55232 16.5462 7.76511 17.3334 6.80157 17.3334C5.83803 17.3334 5.05083 16.5462 5.05083 15.5827V11.1987ZM6.80157 4.16824C5.83803 4.16824 5.05083 3.38103 5.05083 2.41749C5.05083 1.45395 5.83803 0.666748 6.80157 0.666748C7.76511 0.666748 8.55232 1.45395 8.55232 2.41749V4.16824H6.80157ZM6.80157 5.05068C7.76511 5.05068 8.55232 5.83788 8.55232 6.80142C8.55232 7.76496 7.76511 8.55217 6.80157 8.55217H2.41764C1.4541 8.55217 0.666901 7.76496 0.666901 6.80142C0.666901 5.83788 1.4541 5.05068 2.41764 5.05068H6.80157ZM13.8321 6.80142C13.8321 5.83788 14.6193 5.05068 15.5828 5.05068C16.5464 5.05068 17.3336 5.83788 17.3336 6.80142C17.3336 7.76496 16.5464 8.55217 15.5828 8.55217H13.8321V6.80142ZM12.9496 6.80142C12.9496 7.76496 12.1624 8.55217 11.1989 8.55217C10.2354 8.55217 9.44815 7.76496 9.44815 6.80142V2.41749C9.44815 1.45395 10.2354 0.666748 11.1989 0.666748C12.1624 0.666748 12.9496 1.45395 12.9496 2.41749V6.80142ZM11.1989 13.8319C12.1624 13.8319 12.9496 14.6191 12.9496 15.5827C12.9496 16.5462 12.1624 17.3334 11.1989 17.3334C10.2354 17.3334 9.44815 16.5462 9.44815 15.5827V13.8319H11.1989ZM11.1989 12.9495C10.2354 12.9495 9.44815 12.1623 9.44815 11.1987C9.44815 10.2352 10.2354 9.448 11.1989 9.448H15.5828C16.5464 9.448 17.3336 10.2352 17.3336 11.1987C17.3336 12.1623 16.5464 12.9495 15.5828 12.9495H11.1989Z" fill="currentColor" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <img src="assets/img/member_3.jpeg" alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="team-details.html">David Elone</a>
                        </h2>
                        <div className="cs-member_designation">React Developer</div>
                      </div>
                      <div className="cs-member_social cs-primary_color">
                        <a href="#">
                          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.39756 18.333H1.9422V7.20581H5.39756V18.333ZM3.66802 5.68795C2.56311 5.68795 1.6669 4.77277 1.6669 3.66786C1.6669 3.13714 1.87773 2.62814 2.25301 2.25286C2.6283 1.87758 3.13729 1.66675 3.66802 1.66675C4.19875 1.66675 4.70774 1.87758 5.08302 2.25286C5.4583 2.62814 5.66913 3.13714 5.66913 3.66786C5.66913 4.77277 4.77256 5.68795 3.66802 5.68795ZM18.3298 18.333H14.8819V12.9164C14.8819 11.6255 14.8559 9.96995 13.0854 9.96995C11.2889 9.96995 11.0136 11.3725 11.0136 12.8234V18.333H7.56199V7.20581H10.876V8.72367H10.9243C11.3857 7.84941 12.5125 6.92679 14.1937 6.92679C17.6907 6.92679 18.3336 9.22962 18.3336 12.2207V18.333H18.3298Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={14} viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.6204 3.60521C15.631 3.75325 15.631 3.90133 15.631 4.04938C15.631 8.56502 12.194 13.7681 5.91227 13.7681C3.97697 13.7681 2.17918 13.2076 0.666901 12.2347C0.941869 12.2664 1.20623 12.277 1.49177 12.277C3.08862 12.277 4.55861 11.7377 5.73248 10.8176C4.23078 10.7859 2.97231 9.80236 2.53872 8.44871C2.75024 8.48042 2.96173 8.50158 3.18384 8.50158C3.49051 8.50158 3.79722 8.45926 4.08273 8.38527C2.51759 8.06798 1.34369 6.69321 1.34369 5.03288V4.99059C1.79842 5.2444 2.32723 5.40303 2.88768 5.42416C1.96762 4.81078 1.36485 3.76383 1.36485 2.57939C1.36485 1.94488 1.53403 1.36324 1.83015 0.855618C3.51164 2.92838 6.03915 4.282 8.87331 4.43008C8.82045 4.17627 8.78871 3.91191 8.78871 3.64752C8.78871 1.76509 10.3116 0.231689 12.2045 0.231689C13.188 0.231689 14.0764 0.644126 14.7003 1.31037C15.4723 1.16232 16.2126 0.876777 16.8683 0.485499C16.6144 1.27867 16.0751 1.94491 15.3666 2.3679C16.054 2.2939 16.7202 2.10351 17.3336 1.83915C16.8683 2.51594 16.2867 3.11871 15.6204 3.60521V3.60521Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={12} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.9853 1.97421C16.7936 1.25247 16.2289 0.684051 15.5118 0.491149C14.212 0.140625 9.00023 0.140625 9.00023 0.140625C9.00023 0.140625 3.78845 0.140625 2.48868 0.491149C1.7716 0.684081 1.20685 1.25247 1.01517 1.97421C0.666901 3.28241 0.666901 6.01183 0.666901 6.01183C0.666901 6.01183 0.666901 8.74126 1.01517 10.0495C1.20685 10.7712 1.7716 11.3159 2.48868 11.5088C3.78845 11.8594 9.00023 11.8594 9.00023 11.8594C9.00023 11.8594 14.212 11.8594 15.5118 11.5088C16.2289 11.3159 16.7936 10.7712 16.9853 10.0495C17.3336 8.74126 17.3336 6.01183 17.3336 6.01183C17.3336 6.01183 17.3336 3.28241 16.9853 1.97421ZM7.29568 8.48995V3.53372L11.6517 6.01189L7.29568 8.48995Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.16839 11.1987C4.16839 12.1623 3.38119 12.9495 2.41764 12.9495C1.4541 12.9495 0.666901 12.1623 0.666901 11.1987C0.666901 10.2352 1.4541 9.448 2.41764 9.448H4.16839V11.1987ZM5.05083 11.1987C5.05083 10.2352 5.83803 9.448 6.80157 9.448C7.76511 9.448 8.55232 10.2352 8.55232 11.1987V15.5827C8.55232 16.5462 7.76511 17.3334 6.80157 17.3334C5.83803 17.3334 5.05083 16.5462 5.05083 15.5827V11.1987ZM6.80157 4.16824C5.83803 4.16824 5.05083 3.38103 5.05083 2.41749C5.05083 1.45395 5.83803 0.666748 6.80157 0.666748C7.76511 0.666748 8.55232 1.45395 8.55232 2.41749V4.16824H6.80157ZM6.80157 5.05068C7.76511 5.05068 8.55232 5.83788 8.55232 6.80142C8.55232 7.76496 7.76511 8.55217 6.80157 8.55217H2.41764C1.4541 8.55217 0.666901 7.76496 0.666901 6.80142C0.666901 5.83788 1.4541 5.05068 2.41764 5.05068H6.80157ZM13.8321 6.80142C13.8321 5.83788 14.6193 5.05068 15.5828 5.05068C16.5464 5.05068 17.3336 5.83788 17.3336 6.80142C17.3336 7.76496 16.5464 8.55217 15.5828 8.55217H13.8321V6.80142ZM12.9496 6.80142C12.9496 7.76496 12.1624 8.55217 11.1989 8.55217C10.2354 8.55217 9.44815 7.76496 9.44815 6.80142V2.41749C9.44815 1.45395 10.2354 0.666748 11.1989 0.666748C12.1624 0.666748 12.9496 1.45395 12.9496 2.41749V6.80142ZM11.1989 13.8319C12.1624 13.8319 12.9496 14.6191 12.9496 15.5827C12.9496 16.5462 12.1624 17.3334 11.1989 17.3334C10.2354 17.3334 9.44815 16.5462 9.44815 15.5827V13.8319H11.1989ZM11.1989 12.9495C10.2354 12.9495 9.44815 12.1623 9.44815 11.1987C9.44815 10.2352 10.2354 9.448 11.1989 9.448H15.5828C16.5464 9.448 17.3336 10.2352 17.3336 11.1987C17.3336 12.1623 16.5464 12.9495 15.5828 12.9495H11.1989Z" fill="currentColor" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <img src="assets/img/member_4.jpeg" alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="team-details.html">Melina Opole</a>
                        </h2>
                        <div className="cs-member_designation">WP Developer</div>
                      </div>
                      <div className="cs-member_social cs-primary_color">
                        <a href="#">
                          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.39756 18.333H1.9422V7.20581H5.39756V18.333ZM3.66802 5.68795C2.56311 5.68795 1.6669 4.77277 1.6669 3.66786C1.6669 3.13714 1.87773 2.62814 2.25301 2.25286C2.6283 1.87758 3.13729 1.66675 3.66802 1.66675C4.19875 1.66675 4.70774 1.87758 5.08302 2.25286C5.4583 2.62814 5.66913 3.13714 5.66913 3.66786C5.66913 4.77277 4.77256 5.68795 3.66802 5.68795ZM18.3298 18.333H14.8819V12.9164C14.8819 11.6255 14.8559 9.96995 13.0854 9.96995C11.2889 9.96995 11.0136 11.3725 11.0136 12.8234V18.333H7.56199V7.20581H10.876V8.72367H10.9243C11.3857 7.84941 12.5125 6.92679 14.1937 6.92679C17.6907 6.92679 18.3336 9.22962 18.3336 12.2207V18.333H18.3298Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={14} viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.6204 3.60521C15.631 3.75325 15.631 3.90133 15.631 4.04938C15.631 8.56502 12.194 13.7681 5.91227 13.7681C3.97697 13.7681 2.17918 13.2076 0.666901 12.2347C0.941869 12.2664 1.20623 12.277 1.49177 12.277C3.08862 12.277 4.55861 11.7377 5.73248 10.8176C4.23078 10.7859 2.97231 9.80236 2.53872 8.44871C2.75024 8.48042 2.96173 8.50158 3.18384 8.50158C3.49051 8.50158 3.79722 8.45926 4.08273 8.38527C2.51759 8.06798 1.34369 6.69321 1.34369 5.03288V4.99059C1.79842 5.2444 2.32723 5.40303 2.88768 5.42416C1.96762 4.81078 1.36485 3.76383 1.36485 2.57939C1.36485 1.94488 1.53403 1.36324 1.83015 0.855618C3.51164 2.92838 6.03915 4.282 8.87331 4.43008C8.82045 4.17627 8.78871 3.91191 8.78871 3.64752C8.78871 1.76509 10.3116 0.231689 12.2045 0.231689C13.188 0.231689 14.0764 0.644126 14.7003 1.31037C15.4723 1.16232 16.2126 0.876777 16.8683 0.485499C16.6144 1.27867 16.0751 1.94491 15.3666 2.3679C16.054 2.2939 16.7202 2.10351 17.3336 1.83915C16.8683 2.51594 16.2867 3.11871 15.6204 3.60521V3.60521Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={12} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.9853 1.97421C16.7936 1.25247 16.2289 0.684051 15.5118 0.491149C14.212 0.140625 9.00023 0.140625 9.00023 0.140625C9.00023 0.140625 3.78845 0.140625 2.48868 0.491149C1.7716 0.684081 1.20685 1.25247 1.01517 1.97421C0.666901 3.28241 0.666901 6.01183 0.666901 6.01183C0.666901 6.01183 0.666901 8.74126 1.01517 10.0495C1.20685 10.7712 1.7716 11.3159 2.48868 11.5088C3.78845 11.8594 9.00023 11.8594 9.00023 11.8594C9.00023 11.8594 14.212 11.8594 15.5118 11.5088C16.2289 11.3159 16.7936 10.7712 16.9853 10.0495C17.3336 8.74126 17.3336 6.01183 17.3336 6.01183C17.3336 6.01183 17.3336 3.28241 16.9853 1.97421ZM7.29568 8.48995V3.53372L11.6517 6.01189L7.29568 8.48995Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.16839 11.1987C4.16839 12.1623 3.38119 12.9495 2.41764 12.9495C1.4541 12.9495 0.666901 12.1623 0.666901 11.1987C0.666901 10.2352 1.4541 9.448 2.41764 9.448H4.16839V11.1987ZM5.05083 11.1987C5.05083 10.2352 5.83803 9.448 6.80157 9.448C7.76511 9.448 8.55232 10.2352 8.55232 11.1987V15.5827C8.55232 16.5462 7.76511 17.3334 6.80157 17.3334C5.83803 17.3334 5.05083 16.5462 5.05083 15.5827V11.1987ZM6.80157 4.16824C5.83803 4.16824 5.05083 3.38103 5.05083 2.41749C5.05083 1.45395 5.83803 0.666748 6.80157 0.666748C7.76511 0.666748 8.55232 1.45395 8.55232 2.41749V4.16824H6.80157ZM6.80157 5.05068C7.76511 5.05068 8.55232 5.83788 8.55232 6.80142C8.55232 7.76496 7.76511 8.55217 6.80157 8.55217H2.41764C1.4541 8.55217 0.666901 7.76496 0.666901 6.80142C0.666901 5.83788 1.4541 5.05068 2.41764 5.05068H6.80157ZM13.8321 6.80142C13.8321 5.83788 14.6193 5.05068 15.5828 5.05068C16.5464 5.05068 17.3336 5.83788 17.3336 6.80142C17.3336 7.76496 16.5464 8.55217 15.5828 8.55217H13.8321V6.80142ZM12.9496 6.80142C12.9496 7.76496 12.1624 8.55217 11.1989 8.55217C10.2354 8.55217 9.44815 7.76496 9.44815 6.80142V2.41749C9.44815 1.45395 10.2354 0.666748 11.1989 0.666748C12.1624 0.666748 12.9496 1.45395 12.9496 2.41749V6.80142ZM11.1989 13.8319C12.1624 13.8319 12.9496 14.6191 12.9496 15.5827C12.9496 16.5462 12.1624 17.3334 11.1989 17.3334C10.2354 17.3334 9.44815 16.5462 9.44815 15.5827V13.8319H11.1989ZM11.1989 12.9495C10.2354 12.9495 9.44815 12.1623 9.44815 11.1987C9.44815 10.2352 10.2354 9.448 11.1989 9.448H15.5828C16.5464 9.448 17.3336 10.2352 17.3336 11.1987C17.3336 12.1623 16.5464 12.9495 15.5828 12.9495H11.1989Z" fill="currentColor" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* .cs-slide */}
                  <div className="cs-slide">
                    <div className="cs-team cs-style1">
                      <div className="cs-member_thumb">
                        <img src="assets/img/member_1.jpeg" alt="Member" />
                        <div className="cs-member_overlay" />
                      </div>
                      <div className="cs-member_info">
                        <h2 className="cs-member_name">
                          <a href="team-details.html">Melon Bulgery</a>
                        </h2>
                        <div className="cs-member_designation">Product Designer</div>
                      </div>
                      <div className="cs-member_social cs-primary_color">
                        <a href="#">
                          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.39756 18.333H1.9422V7.20581H5.39756V18.333ZM3.66802 5.68795C2.56311 5.68795 1.6669 4.77277 1.6669 3.66786C1.6669 3.13714 1.87773 2.62814 2.25301 2.25286C2.6283 1.87758 3.13729 1.66675 3.66802 1.66675C4.19875 1.66675 4.70774 1.87758 5.08302 2.25286C5.4583 2.62814 5.66913 3.13714 5.66913 3.66786C5.66913 4.77277 4.77256 5.68795 3.66802 5.68795ZM18.3298 18.333H14.8819V12.9164C14.8819 11.6255 14.8559 9.96995 13.0854 9.96995C11.2889 9.96995 11.0136 11.3725 11.0136 12.8234V18.333H7.56199V7.20581H10.876V8.72367H10.9243C11.3857 7.84941 12.5125 6.92679 14.1937 6.92679C17.6907 6.92679 18.3336 9.22962 18.3336 12.2207V18.333H18.3298Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={14} viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.6204 3.60521C15.631 3.75325 15.631 3.90133 15.631 4.04938C15.631 8.56502 12.194 13.7681 5.91227 13.7681C3.97697 13.7681 2.17918 13.2076 0.666901 12.2347C0.941869 12.2664 1.20623 12.277 1.49177 12.277C3.08862 12.277 4.55861 11.7377 5.73248 10.8176C4.23078 10.7859 2.97231 9.80236 2.53872 8.44871C2.75024 8.48042 2.96173 8.50158 3.18384 8.50158C3.49051 8.50158 3.79722 8.45926 4.08273 8.38527C2.51759 8.06798 1.34369 6.69321 1.34369 5.03288V4.99059C1.79842 5.2444 2.32723 5.40303 2.88768 5.42416C1.96762 4.81078 1.36485 3.76383 1.36485 2.57939C1.36485 1.94488 1.53403 1.36324 1.83015 0.855618C3.51164 2.92838 6.03915 4.282 8.87331 4.43008C8.82045 4.17627 8.78871 3.91191 8.78871 3.64752C8.78871 1.76509 10.3116 0.231689 12.2045 0.231689C13.188 0.231689 14.0764 0.644126 14.7003 1.31037C15.4723 1.16232 16.2126 0.876777 16.8683 0.485499C16.6144 1.27867 16.0751 1.94491 15.3666 2.3679C16.054 2.2939 16.7202 2.10351 17.3336 1.83915C16.8683 2.51594 16.2867 3.11871 15.6204 3.60521V3.60521Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={12} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.9853 1.97421C16.7936 1.25247 16.2289 0.684051 15.5118 0.491149C14.212 0.140625 9.00023 0.140625 9.00023 0.140625C9.00023 0.140625 3.78845 0.140625 2.48868 0.491149C1.7716 0.684081 1.20685 1.25247 1.01517 1.97421C0.666901 3.28241 0.666901 6.01183 0.666901 6.01183C0.666901 6.01183 0.666901 8.74126 1.01517 10.0495C1.20685 10.7712 1.7716 11.3159 2.48868 11.5088C3.78845 11.8594 9.00023 11.8594 9.00023 11.8594C9.00023 11.8594 14.212 11.8594 15.5118 11.5088C16.2289 11.3159 16.7936 10.7712 16.9853 10.0495C17.3336 8.74126 17.3336 6.01183 17.3336 6.01183C17.3336 6.01183 17.3336 3.28241 16.9853 1.97421ZM7.29568 8.48995V3.53372L11.6517 6.01189L7.29568 8.48995Z" fill="currentColor" />
                          </svg>
                        </a>
                        <a href="#">
                          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.16839 11.1987C4.16839 12.1623 3.38119 12.9495 2.41764 12.9495C1.4541 12.9495 0.666901 12.1623 0.666901 11.1987C0.666901 10.2352 1.4541 9.448 2.41764 9.448H4.16839V11.1987ZM5.05083 11.1987C5.05083 10.2352 5.83803 9.448 6.80157 9.448C7.76511 9.448 8.55232 10.2352 8.55232 11.1987V15.5827C8.55232 16.5462 7.76511 17.3334 6.80157 17.3334C5.83803 17.3334 5.05083 16.5462 5.05083 15.5827V11.1987ZM6.80157 4.16824C5.83803 4.16824 5.05083 3.38103 5.05083 2.41749C5.05083 1.45395 5.83803 0.666748 6.80157 0.666748C7.76511 0.666748 8.55232 1.45395 8.55232 2.41749V4.16824H6.80157ZM6.80157 5.05068C7.76511 5.05068 8.55232 5.83788 8.55232 6.80142C8.55232 7.76496 7.76511 8.55217 6.80157 8.55217H2.41764C1.4541 8.55217 0.666901 7.76496 0.666901 6.80142C0.666901 5.83788 1.4541 5.05068 2.41764 5.05068H6.80157ZM13.8321 6.80142C13.8321 5.83788 14.6193 5.05068 15.5828 5.05068C16.5464 5.05068 17.3336 5.83788 17.3336 6.80142C17.3336 7.76496 16.5464 8.55217 15.5828 8.55217H13.8321V6.80142ZM12.9496 6.80142C12.9496 7.76496 12.1624 8.55217 11.1989 8.55217C10.2354 8.55217 9.44815 7.76496 9.44815 6.80142V2.41749C9.44815 1.45395 10.2354 0.666748 11.1989 0.666748C12.1624 0.666748 12.9496 1.45395 12.9496 2.41749V6.80142ZM11.1989 13.8319C12.1624 13.8319 12.9496 14.6191 12.9496 15.5827C12.9496 16.5462 12.1624 17.3334 11.1989 17.3334C10.2354 17.3334 9.44815 16.5462 9.44815 15.5827V13.8319H11.1989ZM11.1989 12.9495C10.2354 12.9495 9.44815 12.1623 9.44815 11.1987C9.44815 10.2352 10.2354 9.448 11.1989 9.448H15.5828C16.5464 9.448 17.3336 10.2352 17.3336 11.1987C17.3336 12.1623 16.5464 12.9495 15.5828 12.9495H11.1989Z" fill="currentColor" />
                          </svg>
                        </a>
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
        
        {/* Start Blog Section */}
        <section className="cs-shape_wrap_4 cs-parallax">
          <div className="cs-shape_4 cs-to_up" />
          <div className="cs-shape_4 cs-to_right" />
          <div className="cs-height_150 cs-height_lg_80" />
          <div className="container">
            <div className="cs-slider cs-style1 cs-gap-24">
              <div className="cs-slider_left">
                <div className="cs-section_heading cs-style1">
                  <h3 className="cs-section_subtitle">Our Blog</h3>
                  <h2 className="cs-section_title">Explore recent publication</h2>
                  <div className="cs-height_45 cs-height_lg_20" />
                  <a href="blog.html" className="cs-text_btn wow fadeInLeft" data-wow-duration="0.8s" data-wow-delay="0.2s">
                    <span>View More Blog</span>
                    <svg width={26} height={12} viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25.5303 6.53033C25.8232 6.23744 25.8232 5.76256 25.5303 5.46967L20.7574 0.696699C20.4645 0.403806 19.9896 0.403806 19.6967 0.696699C19.4038 0.989593 19.4038 1.46447 19.6967 1.75736L23.9393 6L19.6967 10.2426C19.4038 10.5355 19.4038 11.0104 19.6967 11.3033C19.9896 11.5962 20.4645 11.5962 20.7574 11.3033L25.5303 6.53033ZM0 6.75H25V5.25H0V6.75Z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="cs-slider_right">
                <div className="cs-post_wrap">
                  <div className="cs-slider_container" data-autoplay={1} data-loop={1} data-speed={1000} data-center={0} data-variable-width={1} data-slides-per-view="responsive" data-xs-slides={1} data-sm-slides={2} data-md-slides={2} data-lg-slides={2} data-add-slides={3}>
                    <div className="cs-slider_wrapper">
                      <div className="cs-slide">
                        <div className="cs-post cs-style1">
                          <a href="blog-details.html" className="cs-post_thumb">
                            <img src="assets/img/post_1.jpeg" alt="Post" />
                            <div className="cs-post_overlay" />
                          </a>
                          <div className="cs-post_info">
                            <div className="cs-posted_by">07 Mar 2022</div>
                            <h2 className="cs-post_title">
                              <a href="blog-details.html">How to keep fear from ruining your art business with confident</a>
                            </h2>
                          </div>
                        </div>
                      </div>
                      {/* .cs-slide */}
                      <div className="cs-slide">
                        <div className="cs-post cs-style1">
                          <a href="blog-details.html" className="cs-post_thumb">
                            <img src="assets/img/post_2.jpeg" alt="Post" />
                            <div className="cs-post_overlay" />
                          </a>
                          <div className="cs-post_info">
                            <div className="cs-posted_by">10 Feb 2022</div>
                            <h2 className="cs-post_title">
                              <a href="blog-details.html">Artistic mind will be great for creation anything</a>
                            </h2>
                          </div>
                        </div>
                      </div>
                      {/* .cs-slide */}
                      <div className="cs-slide">
                        <div className="cs-post cs-style1">
                          <a href="blog-details.html" className="cs-post_thumb">
                            <img src="assets/img/post_3.jpeg" alt="Post" />
                            <div className="cs-post_overlay" />
                          </a>
                          <div className="cs-post_info">
                            <div className="cs-posted_by">05 Apr 2022</div>
                            <h2 className="cs-post_title">
                              <a href="blog-details.html">A.I will take over all job for human within next year</a>
                            </h2>
                          </div>
                        </div>
                      </div>
                      {/* .cs-slide */}
                      <div className="cs-slide">
                        <div className="cs-post cs-style1">
                          <a href="blog-details.html" className="cs-post_thumb">
                            <img src="assets/img/post_1.jpeg" alt="Post" />
                            <div className="cs-post_overlay" />
                          </a>
                          <div className="cs-post_info">
                            <div className="cs-posted_by">07 Mar 2022</div>
                            <h2 className="cs-post_title">
                              <a href="blog-details.html">How to keep fear from ruining your art business with confident</a>
                            </h2>
                          </div>
                        </div>
                      </div>
                      {/* .cs-slide */}
                      <div className="cs-slide">
                        <div className="cs-post cs-style1">
                          <a href="blog-details.html" className="cs-post_thumb">
                            <img src="assets/img/post_2.jpeg" alt="Post" />
                            <div className="cs-post_overlay" />
                          </a>
                          <div className="cs-post_info">
                            <div className="cs-posted_by">10 Feb 2022</div>
                            <h2 className="cs-post_title">
                              <a href="blog-details.html">Artistic mind will be great for creation anything</a>
                            </h2>
                          </div>
                        </div>
                      </div>
                      {/* .cs-slide */}
                      <div className="cs-slide">
                        <div className="cs-post cs-style1">
                          <a href="blog-details.html" className="cs-post_thumb">
                            <img src="assets/img/post_3.jpeg" alt="Post" />
                            <div className="cs-post_overlay" />
                          </a>
                          <div className="cs-post_info">
                            <div className="cs-posted_by">05 Apr 2022</div>
                            <h2 className="cs-post_title">
                              <a href="blog-details.html">A.I will take over all job for human within next year</a>
                            </h2>
                          </div>
                        </div>
                      </div>
                      {/* .cs-slide */}
                    </div>
                  </div>
                  {/* .cs-slider_container */}
                  <div className="cs-pagination cs-style1 cs-hidden_desktop" />
                </div>
              </div>
            </div>
            {/* .cs-slider */}
          </div>
          <div className="cs-height_125 cs-height_lg_70" />
        </section>
        {/* End Blog Section */}
        {/* End Moving Text */}
        <div className="cs-moving_text_wrap cs-bold cs-primary_font">
          <div className="cs-moving_text_in">
            <div className="cs-moving_text">Our reputed world wide partners</div>
            <div className="cs-moving_text">Our reputed world wide partners</div>
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
                <a href="contact.html" className="cs-text_btn wow fadeInUp" data-wow-duration="0.8s" data-wow-delay="0.2s">
                  <span>Apply For Meeting</span>
                  <svg width={26} height={12} viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M25.5307 6.53033C25.8236 6.23744 25.8236 5.76256 25.5307 5.46967L20.7577 0.696699C20.4648 0.403806 19.99 0.403806 19.6971 0.696699C19.4042 0.989593 19.4042 1.46447 19.6971 1.75736L23.9397 6L19.6971 10.2426C19.4042 10.5355 19.4042 11.0104 19.6971 11.3033C19.99 11.5962 20.4648 11.5962 20.7577 11.3033L25.5307 6.53033ZM0.000366211 6.75H25.0004V5.25H0.000366211V6.75Z" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
        {/* End CTA */}
        <span className="cs-scrollup">
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 10L1.7625 11.7625L8.75 4.7875V20H11.25V4.7875L18.225 11.775L20 10L10 0L0 10Z" fill="currentColor" />
          </svg>
        </span>
        
        {/* Script */}
      </div>

      {bigLoader && <Loader />}

      {!bigLoader && (
        <div className={styles.container}>
          <Head>
            <title>Clover</title>
            <meta name="description" content="Chat as a DAO" />
            <link rel="icon" href="/favicon.ico" />
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
            <div className="w-screen overflow-y-scroll overflow-x-hidden absolute h-screen flex items-center bg-[#ffffffb0]">
              <div className="2usm:px-0 mx-auto max-w-[900px] 2usm:w-full relative w-[85%] usm:m-auto min-w-[340px] px-6 my-8 items-center">
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

                <div className="rounded-lg bg-white shadow-lg shadow-[#cccccc]">
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

          <div className="h-screen flex flex-col justify-center">
            {Boolean(loginError.length) && (
              <Alert className="my-2" severity="error">
                {loginError}
              </Alert>
            )}
            <div className="flex justify-around">
              <div className="items-center mt-4 top-0 absolute flex justify-center">
                <Image src={logo} alt="Clover" width={150} height={49.995} />
              </div>
              <div className="self-center">
                <Button
                  onClick={login}
                  style={{
                    fontFamily: "Poppins",
                  }}
                  className="!py-4 !px-8 rounded-lg !capitalize !font-semibold !text-xl !text-white !bg-[#1891fe]"
                >
                  Authenticate
                </Button>
              </div>
              <div className="self-center">
                <Button
                  onClick={() => setOpen(true)}
                  style={{
                    fontFamily: "Poppins",
                  }}
                  className="!py-4 !px-8 rounded-lg !capitalize !font-semibold !text-xl !text-white !bg-[#1891fe]"
                >
                  Register DAO
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home
