import CryptoJS from 'crypto-js';
import { ENV } from '../config/env.js';


const SECRET_KEY = ENV.SECRET_KEY;

export const encrypt= (text:string)=>{
    return CryptoJS.AES.encrypt(text, SECRET_KEY as string).toString();
}

export const decrypt = (ciphertext: string) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY as string);
    return bytes.toString(CryptoJS.enc.Utf8);
}
