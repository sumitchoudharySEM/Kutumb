import Image from 'next/image';
import cicon from "../../../../public/images/icon.png";

const Chatlist = ({name, img, lastMsg, time, onClick}: {name: string, img?: string, lastMsg: string, time?: string | number, onClick: () => void}) => {

    const getx = (t: number) => {
        const ec:number = Number((new Date().getTime() / 1000).toFixed(0));
        const et:number = Number((t / 1000).toFixed(0));
        const delay:number = ec - et;

        if(delay > 43200){
            //daily
            const xd = new Date(t);

            return `${xd.getFullYear()}/${xd.getMonth() + 1}/${xd.getDate()}`

        }else if (delay > 3600) {
            const xh = parseInt((delay / 3600).toString());
            const xm = parseInt(((delay - (xh * 3600)) / 60).toString());

            return xh + "hr" + (xh > 1 ? "s " : " ") + xm + 'min' + (xm > 1 ? "s" : "");
        }else if(delay > 60){
            const xx = parseInt((delay / 60).toString()); 
            
            return xx+'min'+(xx > 1 ? 's' : '')
        }else{
            return delay + 's';
        }

    }

  return (
    <div onClick={onClick} className={`msg`}>
      
      <div className="msg-detail w-fit">
        <div className="msg-username capitalize">{name}</div>
        
      </div>
    </div>
  );
};

export default Chatlist;
