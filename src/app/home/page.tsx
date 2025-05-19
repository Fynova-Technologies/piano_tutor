'use client'
import { useRouter } from 'next/navigation';
import React from 'react';
import Image from 'next/image';





export default function Homepage() {
    const router = useRouter();
    const handleClick = (url: string) => {
        router.push(url);
    };

   

    



    return (
        <div>
            <div className='relative h-[650px] bg-gradient-to-br from-amber-100 to-yellow-200 overflow-hidden rounded-xl shadow-xl'>
                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.4)_0%,_rgba(255,255,255,0)_70%)]'></div>

                    <div className='relative z-10 flex flex-col items-center justify-center h-full px-8 text-center'>
                        <h1 className='text-5xl font-extrabold text-gray-800 mb-8 drop-shadow-md'>
                            Welcome to Melodia
                        </h1>
                        <div className='inline-flex rounded-full bg-white/20 backdrop-blur-md shadow-md p-2 mb-12'>
                            <button className='rounded-full px-6 py-3 font-semibold text-gray-700 hover:bg-yellow-300 hover:text-white transition-colors duration-300'>
                                Beginners
                            </button>
                            <button className='rounded-full px-6 py-3 font-semibold text-gray-700 hover:bg-yellow-300 hover:text-white transition-colors duration-300 ml-2'>
                                Intermediate
                            </button>
                            <button className='rounded-full px-6 py-3 font-semibold text-gray-700 hover:bg-yellow-300 hover:text-white transition-colors duration-300 ml-2'>
                                Advanced
                            </button>
                        </div>
                        <h2 className='text-3xl lg:text-4xl font-semibold text-gray-800 mb-10 drop-shadow-sm'>
                            Unlock Your Inner Musician. Play Beautifully, Effortlessly.
                        </h2>
                        <div>
                            <button
                                onClick={() => handleClick('/musiclibrary')}
                                className={`inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-full py-4 px-8 shadow-lg transition-colors duration-300`}
                            >
                                Start Learning Now
                                <svg className='w-5 h-5 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                                </svg>
                            </button>
                        </div>
                          
                    </div>

                    {/* Decorative Image/Element (Optional) */}
                    <div className='absolute bottom-0 right-0 -mr-24 -mb-24 w-80 h-80 bg-yellow-400 rounded-full blur-xl opacity-50'></div>
                    <div className='absolute top-10 left-10 w-48 h-48 bg-amber-300 rounded-full blur-xl opacity-40'></div>
            </div>
            <div className='bg-gradient-to-br from-amber-100 to-yellow-100 py-16'>
     <div className='container mx-auto flex  justify-center px-6'>
         <div className='w-full lg:w-1/2 space-y-12'>
             <div className='bg-white rounded-xl shadow-lg p-10'>
                 <p className='text-gray-700 leading-relaxed text-lg'>
                     <span className='font-semibold text-yellow-600'>Melodia</span> offers an innovative group piano program designed to make learning engaging, accessible, and fun for students of all ages, particularly
                     children starting as young as 4. The program emphasizes collaborative learning, creativity, and musical exploration through themed lessons, games, and
                     storytelling. It’s ideal for beginners and intermediate learners, fostering a love for music while building solid piano foundations.
                 </p>
             </div>
             <div className='bg-white rounded-xl shadow-lg p-10'>
                 <h3 className='text-gray-800 font-bold text-xl mb-4'>About the Melodia Website:</h3>
                 <ul className='space-y-6 text-gray-700 leading-relaxed'>
                     <li>
                         <span className='font-semibold text-yellow-600'>Purpose:</span> The KeyNotes Music website (www.keynotes-music.com) serves as a hub for teachers, students, and parents, offering resources, training, and support for group piano learning. Created by Melanie Bowes, a music educator pursuing a PhD in group piano, it promotes collaborative teaching methods.
                     </li>
                     <li>
                         <span className='font-semibold text-yellow-600'>Features:</span>
                         <ul className='list-disc list-inside space-y-3 mt-2'>
                             <li>
                                 <span className='font-semibold'>Teaching Resources:</span> Includes lesson plans, Halloween-themed activities, and admin/marketing templates for teachers. Free resources, like 30-45 minute lesson plans for various age groups, are available.
                             </li>
                             <li>
                                 <span className='font-semibold'>Teacher Support:</span> Offers training, case studies, and a community of supportive educators. Melanie provides responsive guidance, ensuring teachers feel equipped.
                             </li>
                             <li>
                                 <span className='font-semibold'>Parent Portal:</span> Provides practice videos and sheets to aid home practice, emphasizing parental involvement.
                             </li>
                             <li>
                                 <span className='font-semibold'>Blog and Insights:</span> Shares tips on group piano teaching, marketing, and holistic progress, with articles like “Engaging the Age” and “Escaping the Repertoire Race.”
                             </li>
                         </ul>
                     </li>
                     <li>
                         <span className='font-semibold text-yellow-600'>User Experience:</span> The site is user-friendly, with clear navigation for accessing program details, resources, and enrollment info. It’s designed for both solo teachers and large studios, with a focus on community and innovation.
                     </li>
                     <li>
                         <span className='font-semibold text-yellow-600'>Value:</span> The subscription is praised for its affordability and comprehensive materials, requiring minimal prep for teachers. It’s described as a “ready-to-go” program with flexibility for customization.
                     </li>
                 </ul>
             </div>
         </div>
         <div className='hidden lg:block w-1/2 pl-16'>
             <div className='shadow-xl rounded-xl overflow-hidden'>
                 <Image src="/3deef617-aad2-4931-a82c-d50f411529dd.jpeg" height={700} width={700} alt="Piano" className="object-cover h-full w-full" />
             </div>
         </div>
        </div>
    </div>
                     
            
        </div>
    );
}
