import { NFTStorage } from "nft.storage";
import { Web3Storage } from "web3.storage";

export const makeStorageClient = (token) => {
    return new Web3Storage({
        token
    });
};

export const makeNFTClient = (token) => {
    return new NFTStorage({
        token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQ3MTQ1NDAxNjA3YWI1NUUyOWZFODRmNjMzNTJiOTY4ODg0RmYwNTIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NjY0NjM3NjU3MSwibmFtZSI6Ik5GVCBBUEkifQ.y34v-YTG1nS7g1nqNqz9s7YYYXdGzPfAQzlM9knZYco"
    });
}
