'use client'

import LogoutButton from '@/app/logout/page';
import Image from 'next/image';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function UserPopup({userPopupOpen, setUserPopupOpen, userLoggedIn}:{userPopupOpen:boolean, setUserPopupOpen:React.Dispatch<React.SetStateAction<boolean>>, userLoggedIn:boolean}) {
    return(
        <div>
            <div className='flex items-center justify-between gap-4 border-b px-2 py-2'>
                <div className='flex items-center gap-4 px-4 py-2'>
                    <Image src="/assets/user.png" alt="User" width={50} height={50} />
                    <div className='flex flex-col gap-2'>
                        <span className='text-[#151517] font-medium text-[16px]'>Anonymous</span>
                        <span className='text-[#1E90FF] font-medium text-[12px]'>Free Trial</span>
                    </div>
                </div>
                <div>
                    <button className='w-full text-center text-[14px] bg-[#581845] text-white px-4 py-2 rounded-lg hover:bg-[#4F163E]'>Upgrade</button>

                </div>

            </div>
            <div className=' text-[16px] no-underline'>
                <a href="/profile" className=" block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline">My Account</a>
                <a href="/settings" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline">Student & Classes</a>
                <a href="/settings" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline">Instrument Settings</a>
                <a href="/settings" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline">Preferences</a>
                <a href="/settings" className="block px-4 py-4 text-[#151517] hover:bg-gray-100 no-underline">Support</a>

                {userLoggedIn ? <LogoutButton /> : <div className='border-t-[#6E6E73] border-t-1'><a href="/login" className=" text-[#151517]  rounded-lg no-underline "><div className='space-x-4 px-4 py-4'><Image src ="/loginicon.svg" height={13} width={13} alt="Login Icon" /><span>Login</span></div></a></div>}

            </div>
                
        </div>
    )
}