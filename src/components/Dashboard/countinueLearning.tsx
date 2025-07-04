import Image from "next/image"; 

export default function ContinueLearning() {
    const courses = [
  {
    title: "Piano Mastery Level 1",
    chapter: "Chapter 3: Scales and Arpeggios",
    percentageCompleted: 65,
    timeToComplete: "2h 45m",
    imageUrl: "/assets/C1.png"
  },
  {
    title: "Guitar Basics for Beginners",
    chapter: "Chapter 2: Chords and Strumming",
    percentageCompleted: 40,
    timeToComplete: "1h 30m",
    imageUrl: "/assets/c2.jpg"
  },
  {
    title: "Drumming Fundamentals",
    chapter: "Chapter 5: Rhythm & Timing",
    percentageCompleted: 80,
    timeToComplete: "3h 10m",
    imageUrl: "/assets/c3.jpg"
  },{
    title: "Drumming Fundamentals",
    chapter: "Chapter 5: Rhythm & Timing",
    percentageCompleted: 80,
    timeToComplete: "3h 10m",
    imageUrl: "/assets/c4.jpg"
  },
  {
    title: "Drumming Fundamentals",
    chapter: "Chapter 5: Rhythm & Timing",
    percentageCompleted: 80,
    timeToComplete: "3h 10m",
    imageUrl: "/assets/c5.jpg"
  }
];

    return(
        <div className=" min-h-[500px] flex justify-center bg-[#F8F6F1] px-1 py-16">
            <div className="max-w-[90%] w-full">
                <h1 className="text-black text-2xl font-bold ">Continue Learning</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 p-4">
      {courses.map((course, index) => (
        <div key={index} className="w-[80%] h-[100px] mx-auto">
          

          {/* Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg group">
            {/* Image */}
            <Image
              src={course.imageUrl}
              alt={course.title}
              width={400}
              height={400}
              className="object-cover w-full h-[300px] transition-transform duration-300"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black opacity-40"></div>


            <div className="absolute bottom-0 left-2 right-2">
              <h1 className="text-sm">Your Progress</h1>  
              <div className=" flex text-[#D4AF37] font-bold text-lg mt-1">
                {course.percentageCompleted}% Completed
                <div className=" text-white text-sm mx-auto bg-black bg-opacity-50 px-2 py-1 rounded">
              {course.timeToComplete}
            </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={course.percentageCompleted}
                className="w-full accent-yellow-400 "
                disabled
              />
              
            </div>

         
          
          </div>
          <div className="mb-2">
            <h2 className="text-xl text-gray-900">{course.title}</h2>
            <p className="text-sm text-gray-600">{course.chapter}</p>
          </div>
        </div>
      ))}
    </div>


            </div>

        </div>

    )
}
