import { NFTStorage } from "nft.storage";
import { Web3Storage } from "web3.storage";

export const makeStorageClient = (token) => {
    return new Web3Storage({
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDU2M0Y1QmY4Qzc1ODUyMDNjYjI1N2U1ZGMzNTc0Q0RFZjNkQTQ3MjAiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzY2NDkwMDM4NzIsIm5hbWUiOiJLdXR1bWIifQ.atu2QcpoeMhLn32zYzWX-Rl-kg4Yrvt3__aJPSIrAvk"
    });
};

export const makeNFTClient = (token) => {
    return new NFTStorage({
        token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQ3MTQ1NDAxNjA3YWI1NUUyOWZFODRmNjMzNTJiOTY4ODg0RmYwNTIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NjY0NjM3NjU3MSwibmFtZSI6Ik5GVCBBUEkifQ.y34v-YTG1nS7g1nqNqz9s7YYYXdGzPfAQzlM9knZYco"
    });
}
