import Image from "next/image";
import { useEffect, useState, useContext } from "react";
import Link from "next/link";
import Router from "next/router";
import logo from "../../../public/images/logo.png";
import Select from "react-select";
import { sendNotification } from "../extras/storage/init";

import { BsFolder, BsPlusLg } from "react-icons/bs";
import {
  FiImage,
  FiSettings,
  FiMoon,
  FiPaperclip,
  FiPlusCircle,
  FiVideo,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import Storage from "../storage";
import { MdMeetingRoom, MdOutlineEmojiEmotions } from "react-icons/md";
import {
  LinearProgress,
  TextField,
  IconButton,
  Button,
  Modal,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  Box,
  Tab,
} from "@mui/material";
import Picker from "emoji-picker-react";
import { logout } from "../extras/logout";
import empty from "../../../public/images/empty.png";
import cicon from "../../../public/images/icon.png";
import { GenContext } from "../extras/contexts/genContext";
import {
  beginStorageProvider,
  lq,
  retrieveMessages,
  saveMessages,
  notifications,
  retrieveFiles,
  storeFiles,
} from "../extras/storage/init";
import { FaCloud } from "react-icons/fa";
import { CContext } from "../extras/contexts/CContext";
import Text from "./texts";
import Chatlist from "./sidebar/chatlist";
import Loader from "../loader";
import { useAccount } from "wagmi";
import Rooms from "../../../app/components/video";


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  className?: string;
  padding?: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, padding, value, index, className = "", ...other } = props;

  const pc = {
    p: padding,
    py: padding !== undefined ? undefined : 2,
  };

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className={className} sx={pc}>
          {children}
        </Box>
      )}
    </div>
  );
};


const Chats = () => {
  const [loginData, setLoginData] = useState<any>({});

  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (localStorage.getItem("cloverlog") === null) {
      Router.push("/");
    } else {
      const data = JSON.parse(localStorage.getItem("cloverlog") || "{}");

      setLoginData(data);
    }
  }, []);

  const { name, contract, data: main, participants } = loginData;

  document.querySelectorAll("textArea, .emoji-scroll-wrapper").forEach((e) => {
    e.classList.add("cusscroller");
  });

  const [showEmoji, setShowEmoji] = useState(false);

  const [messageText, setMessageText] = useState("");

  const [group, setGroup] = useState<any>();

  const [currentDir, setCurrentDir] = useState<string[]>(["main"]);

  /* upload */
  const uploadData = useContext(GenContext);

  const [update, setUpdate] = useState<boolean>(false);

  const [isLoading, setLoader] = useState(true);

  const [nname, setNname] = useState<string>("");

  const [disparts, setDisparts] = useState<(string | undefined)[]>([]);

  const [toggle, setToggle] = useState<string | number>('0');

  const [discussions, setDiscussion] = useState<string>('');

  const [voteDesc, setVoteDesc] = useState<string>('');

  const [failMessage, setFailMessage] = useState<string>("");

  const [messData, updateMessData] = useState<{
    [index: string]: { participants: any[]; messages: any[] };
  }>({
    current: {
      messages: [
        {
          content: [["This is a test"]],
          isSending: false,
          sender: "address",
          read: false,
          date: new Date().getTime(),
        },
      ],
      participants: [],
    },
  });

  const chatlst = Object.keys(messData);

  useEffect(() => {
    async function init() {
      await beginStorageProvider({
        user: address || "",
        contract,
        randId: main,
        participants,
      });

      const mess = await retrieveMessages();

      if (!mess[name] || mess[name]["messages"] === undefined) {
        mess[name] = { messages: [] };
      }

      if (group === undefined) {
        setGroup(name);
      }

      updateMessData(mess);

      setLoader(false);
    }

    if (name != undefined) {
      init();
    }
  }, [main, currentDir, uploadData, update, contract, name, address, participants, group]);

  const [enlargen, setEnlargen] = useState<number>(0);

  const rContext = useContext(CContext);

  const moveMessage = async (
    enlargen: boolean,
    type: "mess" | "vote" = "mess"
  ) => {

    console.log(messageText);

    if (messageText.length) {
      if (messData[group || ""]["messages"] === undefined) {
        messData[group || ""]["messages"] = [];
      }

      const newMess: any = {
        content: [[messageText]],
        isSending: true,
        sent: false,
        type,
        server: false,
        enlargen,
        sender: address,
        date: new Date().getTime(),
      };

      if (rContext?.sender !== undefined) {
        newMess["reply"] = rContext.sender;
        newMess["content"][0].push(rContext.content || "");
      }

      let index: number;

      messData[group || ""]["messages"].push(newMess);

      index = messData[group || ""]["messages"].length - 1;

      updateMessData(messData);

      const chatArea = document.querySelector(".chat-area");

      if (chatArea !== null) {
        chatArea.scrollTop = chatArea.scrollHeight;
      }

      try {
        const serverData = { ...messData };

        serverData[group || ""]["messages"][index]["server"] = true;

        notifications({
          title: `Message from ${address}`,
          message: messageText,
          receivers: lq[2],
          exclude: address || "",
        });

        await saveMessages(serverData);

        messData[group || ""]["messages"][index].sent = true;

        updateMessData(messData);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const onEClick = (event: any, eObject: any) => {
    setEnlargen(enlargen + 1);
    setMessageText(messageText + eObject.emoji);
  };

  const [addNew, setAddNew] = useState<boolean>(false);

  return (
    <>
      {isLoading && <Loader />}

      {!isLoading && (
        <div className="app dark">
          <Modal open={addNew} onClose={() => setAddNew(false)}>
            <div className="w-screen overflow-y-scroll overflow-x-hidden absolute h-screen flex items-center bg-[#ffffff40]">
              <div className="2usm:px-0 mx-auto max-w-[900px] 2usm:w-full relative w-[85%] usm:m-auto min-w-[340px] px-6 my-8 items-center">
                <div className="rounded-lg shadow-lg shadow-[#cccccc] modal-dark">
                  <div className="border-b flex justify-between py-[14px] px-[17px] text-xl font-bold">
                    Create
                    <FiX
                      size={20}
                      className="cursor-pointer"
                      onClick={() => setAddNew(false)}
                    />
                  </div>
                  <div className="form relative">
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
                          <ToggleButtonGroup
                            value={toggle}
                            className="cusscroller"
                            sx={{
                              width: "100%",
                              padding: "0px 10px",
                              margin: "10px 0px 20px",
                              "& .Mui-selected": {
                                backgroundColor: `#1890FF !important`,
                                color: `#fff !important`,
                              },
                              "& .MuiToggleButtonGroup-grouped": {
                                borderRadius: "4rem !important",
                                minWidth: 55,
                                fontFamily: "Poppins, sans-serif",
                                paddingTop: "4px",
                                margin: "0px 10px",
                                paddingBottom: "4px",
                                border:
                                  "1px solid rgba(0, 0, 0, 0.12) !important",
                              },
                            }}
                            exclusive
                            onChange={(e: any) => {
                              if (e.target.value != "2") {
                                setToggle(e.target.value);
                              }
                            }}
                          >
                            {/* <ToggleButton
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: "500",
                              }}
                              value={"0"}
                            >
                              Discussion Channel
                            </ToggleButton> */}
                            {/* <ToggleButton
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: "500",
                              }}
                              value={"1"}
                            >
                              A new voting campaign
                            </ToggleButton> */}
                            {contract.toLowerCase() ==
                              "0xacdfc5338390ce4ec5ad61e3dc255c9f2560d797" && (
                              <ToggleButton
                                sx={{
                                  textTransform: "capitalize",
                                  fontWeight: "500",
                                }}
                                value={"2"}
                              >
                                A New Participant
                              </ToggleButton>
                            )}
                          </ToggleButtonGroup>
                        </div>

                        <TabPanel padding={0} value={Number(toggle)} index={0}>
                          <div>
                            <TextField
                              fullWidth
                              id="outlined-basic"
                              label="Name of discussion channel"
                              variant="outlined"
                              value={nname}
                              onChange={(
                                e: React.ChangeEvent<
                                  HTMLInputElement | HTMLTextAreaElement
                                >
                              ) => {
                                setNname(e.target.value);
                                setFailMessage("");
                              }}
                            />
                          </div>

                          <div className="mt-4">
                            {/* <label className="text-[#808080] mb-2 block">
                              Add members, click on registered members to add
                            </label> */}

                            <div className="flex w-full items-center cusscroller flex-nowrap overflow-y-hidden overflow-x-scroll">
                              {participants.map(
                                (v: string, i: number) =>
                                  v.toLowerCase() != address?.toLowerCase() && (
                                    <div
                                      onClick={() => {
                                        const selected = [...disparts];

                                        if (selected[i] !== undefined) {
                                          selected[i] = undefined;

                                          setDisparts(selected);
                                        } else {
                                          selected[i] = v;

                                          setDisparts(selected);
                                        }
                                      }}
                                      style={
                                        disparts[i] !== undefined
                                          ? {
                                              color: "#fff",
                                              backgroundColor: "#1890FF",
                                            }
                                          : {}
                                      }
                                      className="truncate cursor-pointer rounded-[4rem] max-w-[200px] hover:max-w-[450px] py-1 px-[10px] font-[500] text-[#444444] delay-500 transition-all border border-solid border-[rgba(0,0,0,0.12)] mx-[3px]"
                                      key={i}
                                    >
                                      {v}
                                    </div>
                                  )
                              )}
                            </div>
                            <span className="text-[14px] block mt-1 text-[#b6b6b6]">
                              You can select any channel!
                            </span>
                          </div>

                          <Button
                            variant="contained"
                            className="!bg-[#1891fe] !mt-4 !py-[13px] !font-medium !capitalize"
                            style={{
                              fontFamily: "inherit",
                            }}
                            onClick={async () => {
                              if (nname.length) {
                                setLoader(true);

                                try {
                                  const nMessData = { ...messData };

                                  nMessData[nname]["participants"] =
                                    disparts.filter((v) => v !== undefined);

                                  nMessData[nname]["messages"] = [];

                                  await saveMessages(JSON.stringify(nMessData));

                                  updateMessData(nMessData);

                                  setGroup(nname);

                                  setDisparts([]);

                                  setAddNew(false);

                                  setLoader(false);
                                } catch (err: any) {
                                  setLoader(false);

                                  setFailMessage(
                                    "Something went wrong, please try again later"
                                  );
                                }
                              } else {
                                setFailMessage("Name of channel is required");
                              }
                            }}
                            fullWidth
                          >
                            Create
                          </Button>
                        </TabPanel>

                        <TabPanel padding={0} value={Number(toggle)} index={1}>
                          <div className="mb-4">
                            <TextField
                              fullWidth
                              id="outlined-basic"
                              label="Name"
                              variant="outlined"
                              value={nname}
                              onChange={(
                                e: React.ChangeEvent<
                                  HTMLInputElement | HTMLTextAreaElement
                                >
                              ) => {
                                setNname(e.target.value);
                                setFailMessage("");
                              }}
                            />
                          </div>

                          <div className="mb-4">
                            <TextField
                              fullWidth
                              id="outlined-basic"
                              label="Description"
                              multiline
                              variant="outlined"
                              value={voteDesc}
                              onChange={(
                                e: React.ChangeEvent<
                                  HTMLInputElement | HTMLTextAreaElement
                                >
                              ) => {
                                setVoteDesc(e.target.value);
                                setFailMessage("");
                              }}
                            />
                          </div>

                          <div className="mb-5">
                            <label className="text-[#808080] mb-2 block">
                              Select Discussion Channel participants can vote on
                            </label>

                            <Select
                              isClearable={false}
                              value={discussions}
                              onChange={(e: any) => setDiscussion(e)}
                              name="Channels"
                              placeholder={"Channels..."}
                              options={Object.keys(messData)}
                              styles={{
                                option: (provided: any, state: any) => {
                                  return {
                                    ...provided,
                                    backgroundColor: state.isSelected
                                      ? "#dfdfdf"
                                      : "transparent",
                                    cursor: "pointer",
                                    "&:active": {
                                      backgroundColor: "#dfdfdf",

                                      color: "#121212 !important",
                                    },
                                    "&:hover": {
                                      backgroundColor: state.isSelected
                                        ? undefined
                                        : `#dfdfdff2`,
                                    },
                                  };
                                },
                                container: (provided: any, state: any) => ({
                                  ...provided,
                                  "& .select__control": {
                                    borderWidth: "0px",
                                    borderRadius: "0px",
                                    backgroundColor: "transparent",
                                    borderBottomWidth: "1px",
                                  },
                                  "& .select__value-container": {
                                    paddingLeft: "0px",
                                  },
                                  "& .select__control:hover": {
                                    borderBottomWidth: "2px",
                                    borderBottomColor: "#121212",
                                  },
                                  "& .select__control--is-focused": {
                                    borderWidth: "0px",
                                    borderBottomWidth: "2px",
                                    borderBottomColor: `#1891fe !important`,
                                    boxShadow: "none",
                                  },
                                }),
                              }}
                              classNamePrefix="select"
                            />
                          </div>

                          <Button
                            variant="contained"
                            className="!bg-[#1891fe] !mt-4 !py-[13px] !font-medium !capitalize"
                            style={{
                              fontFamily: "inherit",
                            }}
                            onClick={async () => {
                              if (nname.length && voteDesc.length && discussions.length) {
                                setLoader(true);

                                try {
                                  const nMessData = { ...messData };

                                  if (nMessData[discussions] !== undefined) {
                                    
                                      const newMess: any = {

                                        content: { name: nname, desc: voteDesc },
                                        sent: true,
                                        type: "vote",
                                        creator: address,
                                        expiry: new Date().getTime(),
                                      };                                    

                                      nMessData[discussions]["messages"].push(newMess);

                                      await saveMessages(
                                        JSON.stringify(nMessData)
                                      );

                                      notifications({
                                        title: `Vote campaign created by ${String(
                                          address
                                        ).substring(0, 6)}...
                      ${String(address).substring(38, 42)}`,
                                        message: voteDesc,
                                        receivers: nMessData[discussions]['participants'].length ? nMessData[discussions]['participants'] : lq[2],
                                        exclude: address || "",
                                      });

                                      updateMessData(nMessData);

                                      setGroup(discussions);

                                      setDisparts([]);

                                      setAddNew(false);

                                      setLoader(false);

                                  }else{
                                    setLoader(false);

                                    setFailMessage(
                                      "Discussion channel not found"
                                    );
                                  }
                                  
                                } catch (err: any) {
                                  setLoader(false);

                                  setFailMessage(
                                    "Something went wrong, please try again later"
                                  );
                                }
                              } else {
                                setFailMessage("Please all inputs are required");
                              }
                            }}
                            fullWidth
                          >
                            Create
                          </Button>
                        </TabPanel>
                      </FormControl>
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          </Modal>

          <div className="header dark">
            <div className="logo">
              KUTUMB
            </div>
            <div
                className={`msg`}
                onClick={() => {
                  setGroup("");
                }}
              > Storage
              </div>
              <div
                className={`msg`}
                title="Add More Discussions, voting, airdrop"
                onClick={() => setAddNew(true)}
              >
                   Addition 
              </div> 
              {chatlst.map((gps, i) => {
                const clst =
                  messData[gps]["messages"][
                    messData[gps]["messages"].length - 1
                  ];

                return (
                  
                  <Chatlist
                    key={i}
                    onClick={() => {
                      setGroup(gps);

                      if (rContext.update !== undefined) {
                        rContext.update({
                          content: undefined,
                          sender: undefined,
                        });
                      }
                    }}
                    time={clst !== undefined ? clst["date"] : undefined}
                    img={cicon.src}
                    lastMsg={clst !== undefined ? clst["content"] : ""}
                    name={`${gps} ${!i ? "(Main)" : ""}`}
                  />
                );
              })}  
            <div className="search-bar">
             
              {/* <input type="text" placeholder="Search..." /> */}
            </div>
            <div className="user-settings">
              
             
                <button className="btn btn-primary px-15" onClick={logout}>Logout</button>
              
            </div>
          </div>
          <div className="wrapper">

            {group == "" && <Storage />}

            {group === true && <Rooms />}

            {Boolean(group != "" && typeof group == "string") && (
              <>
                <div className="chat-area cusscroller">
                  <div className="chat-area-header dark">
                    <div className="chat-area-title capitalize">{group} <br /><div className="detail-subtitle">
                      Created : {main.substring(0, 6)}..
                      {main.substring(38, 42)}
                    </div></div>
                    
                    <div className="">
                      <span>{messData[group]["messages"].length}</span>
                    </div>
                  </div>
                  <div className="chat-area-main">
                    {Boolean(messData[group]["messages"].length) && (
                      <>
                        {messData[group]["messages"].map(
                          (
                            {
                              sender,
                              date,
                              content,
                              reply,
                              type,
                              server,
                              sent,
                              enlargen,
                            },
                            i
                          ) => (
                            type == 'mess' ? <Text
                              sender={sender}
                              date={date}
                              key={i}
                              content={content}
                              sent={server || sent}
                              reply={reply}
                              enlargen={Boolean(enlargen)}
                            /> : <></>
                          )
                        )}
                      </>
                    )}
                    {!Boolean(messData[group]["messages"].length) && (
                      <div
                        className="empty"
                        style={{
                          display: "flex",
                          width: "100%",
                          height: "fit-content",
                          justifyContent: "center",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div className="h-[259px] justify-center w-full my-5 flex">
                          <Image
                            src={empty}
                            className="mb-3"
                            width={350}
                            height={259}
                            alt="No messages yet"
                          />
                        </div>

                      </div>
                    )}
                  </div>
                  <div className="chat-area-footer dark">
                    {Boolean(rContext?.sender) && (
                      <div className="flex justify-between items-center w-full">
                        <div className="py-[10px] opacity-[.7] flex flex-col">
                          <span className="font-bold text-[10px]">
                            {`Replying to ${
                              rContext?.sender == address
                                ? "self"
                                : rContext?.sender
                            }`}
                          </span>
                          <span className="truncate text-[14px]">
                            {rContext?.content}
                          </span>
                        </div>

                        <div>
                          <FiX
                            size={24}
                            onClick={() => {
                              if (rContext.update !== undefined) {
                                rContext.update({
                                  content: undefined,
                                  sender: undefined,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {showEmoji && (
                      <Picker
                        searchPlaceholder="Search..."
                        pickerStyle={{
                          position: "absolute",
                          height: "260px",
                          bottom: "60px",
                          right: "0px",
                        }}
                        onEmojiClick={onEClick}
                      />
                    )}

                    <div className="flex w-full items-center relative">
                      <TextField
                        style={{
                          backgroundColor: "#fff1",
                        }}
                        type="text"
                        value={messageText}
                        onKeyDown={(e) => {
                          if (
                            (e.keyCode == 13 || e.which === 13) &&
                            !e.shiftKey
                          ) {
                            e.preventDefault();
                            moveMessage(enlargen == 1);
                            sendNotification({message: messageText});
                            setEnlargen(0);

                            setMessageText("");
                          } else {
                            setEnlargen(0);
                          }
                        }}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type something here..."
                        multiline
                        fullWidth
                        maxRows={3}
                        sx={{
                          "& .MuiInputBase-root": {
                            padding: "12px",
                            paddingRight: "45px",
                            marginRight: "12px",
                            marginLeft: "4px",
                            borderRadius: "16px",
                            backgroundColor: "#f3f3f3",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            border: "none !important",
                          },
                          "& .MuiInputBase-input": {
                            fontSize: "15px",
                            fontFamily: "Poppins !important",
                          },
                        }}
                      />

                      <div className="flex absolute right-[10px] items-center">
                        <MdOutlineEmojiEmotions
                          onClick={() => setShowEmoji(!showEmoji)}
                          size={24}
                          style={{
                            fill: showEmoji ? "#ffd900" : undefined,
                          }}
                          className="feather fill-[#727272] transition-all delay-[400] feather-smile hover:fill-[#ffd900]"
                        />
                        
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chats;
