import { useNavigate } from "react-router-dom";
import GlareCard from "./GlareCard";
import { User } from "../../shared/types/User";

export const ProfileCard = (user: User) => {
  const nav = useNavigate();
  return (
    <GlareCard>
      <div className="w-full h-[50%] overflow-hidden rounded-t-xl">
        <img
          src={user.profilePicture ? URL.createObjectURL(user.profilePicture) : "/pic.jpeg"}
          alt={"../../assets/pic.jpeg"}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="group relative text-left w-full pl-4 pt-2">
        <h3 className="text-xl font-bold text-gray-800 transition-colors duration-200 w-full">
          <a
            href={`/profile/${user.id}`}
            onClick={() => nav(`/profile/${user.id}`)}
            className="before:absolute before:inset-0 before:z-10 hover:text-blue-600 hover:underline"
          >
            {user.username}
          </a>
        </h3>
      </div>

      {/* <div className="mt-4 w-full text-left pl-4">
        <p className="text-sm font-semibold text-gray-700">
          {jobsCompleted}+ Jobs Completed
        </p>
      </div> */}
    </GlareCard>
  );
};
