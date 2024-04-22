import React, { useEffect, useState } from "react";
import Carousel from './Carousel';
import styles from '../../assets/css/profile.module.css';
import kanye from '../../assets/images/kanye.png';
import other from '../../assets/images/testprofile.png';
import qnaData from "./qnaOptions.json";
import backend from "../../backend.js";
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';

const Profile = (props) => {
  const { user_data, editable, handleBioChange, handleQnaChange, qnaAnswers } = props;
  const [pictureUrls, setPictureUrls] = useState(["", "", ""]);
  const [sliderValue, setSliderValue] = useState({ min: 80, max: 144 });
  const [selectedTopFive, setSelectedTopFive] = useState("Superheroes");
  const [topFiveSuperheroes, setTopFiveSuperheroes] = useState(["", "", "", "", ""]);
  const [topFiveMovies, setTopFiveMovies] = useState(["", "", "", "", ""]);
  const [customCategory, setCustomCategory] = useState("");
  const [topFiveCustom, setTopFiveCustom] = useState(["", "", "", "", ""]);

  const formatTime = (value) => {
    const hours = Math.floor(value / 4);
    const minutes = (value % 4) * 15;
    const ampm = hours < 12 ? "am" : "pm";
    const formattedHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    // Special case when the slider passes 12pm
    if (value === 144) {
      return `12pm+`;
    }

    // Special case when the slider passes 12
    if (hours >= 24) {
      if (hours === 24) {
        return `12:${minutes === 0 ? "00" : minutes}am`;
      }
      return `${hours - 24}:${minutes === 0 ? "00" : minutes}am`;
    }

    return `${formattedHours}:${minutes === 0 ? "00" : minutes}${ampm}`;
  };

  useEffect(() => {
    fetchPictureUrls();
  }, []);

  const getSelectedOptionId = (questionId) => {
    if (Array.isArray(qnaAnswers)) {
      const answer = qnaAnswers.find(ans => ans.question_id === questionId);
      return answer ? answer.option_id : null;
    }
    return null;
  };

  const fetchPictureUrls = async () => {
    try {
      const response = await backend.get("/profile/user-pictures", {
        params: { user_id: user_data.user_id },
        withCredentials: true,
      });
      if (response) {
        const data = response.data;
        setPictureUrls(data.pictureUrls)
      } else {
        throw new Error("Failed to fetch picture URLs");
      }
    } catch (error) {
      console.error("Error fetching picture URLs:", error);
    }
  };

  const qnaItems = qnaData.map((item, index) => (
    <div key={item.id} className={`flex w-full pl-5 pr-5 border-b ${index !== qnaData.length - 1 ? 'mb-[0.75vh]' : ''} ${index === 0 ? 'mt-2' : ''} ${index === 2 ? 'mt-1' : ''} ${index === 3 ? 'border-b-0' : ''}`} style={{ minHeight: '1rem' }}>
      <p className="flex-1 flex items-center" style={{ lineHeight: '1.65' }}>{item.question}</p>
      {editable ? (
        <select
          className={"text-right"}
          value={getSelectedOptionId(item.id) || ''}
          onChange={(event) => handleQnaChange(event, item.id)}
        >
          {item.options.map((option) => (
            <option key={option.option_id} value={option.option_id}>
              {option.text}
            </option>
          ))}
        </select>
      ) : (
        <p className="truncate whitespace-nowrap">
          {item.options.find(o => o.option_id === getSelectedOptionId(item.id))?.text || 'N/A'}
        </p>
      )}
    </div>
  ));

  const handleTopFiveChange = (event) => {
    const value = event.target.value;
    setSelectedTopFive(value);
    if (value === "Custom") {
      setCustomCategory("");
      setTopFiveCustom(["", "", "", "", "", ""]);
    } else {
      setCustomCategory(value);
    }
  };

  const handleCustomCategoryChange = (event) => {
    setCustomCategory(event.target.value);
  };

  const handleTopFiveItemChange = (index, category, value) => {
    switch (category) {
      case 'Superheroes':
        setTopFiveSuperheroes(prevSuperheroes => {
          const newSuperheroes = [...prevSuperheroes];
          newSuperheroes[index] = value;
          return newSuperheroes;
        });
        break;
      case 'Movies':
        setTopFiveMovies(prevMovies => {
          const newMovies = [...prevMovies];
          newMovies[index] = value;
          return newMovies;
        });
        break;
      case 'Custom':
        setTopFiveCustom(prevCustom => {
          const newCustom = [...prevCustom];
          newCustom[index] = value;
          return newCustom;
        });
        break;
      default:
        break;
    }
  };
  
  

  return (
    <div className={"m-auto w-[65vw] h-screen flex items-center justify-center font-profile font-bold text-maroon_new"}>
      <div className={"w-full flex flex-col  h-[70vh] mb-[6vh] bg-white rounded-3xl overflow-hidden"}>
        <div className={"flex h-[35vh] "}>
          <div className={"w-[18vw] h-[20vh] bg-white rounded-3xl mt-[4vh] ml-[3vh]"}>
            <Carousel pictureUrls={pictureUrls} editable={editable}></Carousel>
          </div>
          <div className={"flex-grow flex flex-col bg-white"}>
            <div className={"h-[3vh]"}>
              <p className={"text-[1.22vw] mt-[6vh] inline-block"}>
                <span className="font-bold ml-[1.3vw] text-[1.7vw]">{user_data.first_name} {user_data.last_name}:</span> {user_data.gender.charAt(0).toUpperCase() + user_data.gender.slice(1)}, {user_data.major} Major, {user_data.college.toUpperCase()} Class of {user_data.graduating_year}
              </p>
            </div>
            <div className={"flex-grow rounded-3xl w-[41.5vw] ml-[1.5vw] mt-[8vh] mb-[-0.48vh] border-2 border-maroon_new overflow"}>
              <p className={"w-full h-full"}>
                {editable ? (
                  <textarea
                    className={`${styles.bioTextArea} ${editable ? 'w-full h-full' : ''}`}
                    value={props.editedBio || ''}
                    onChange={handleBioChange}
                    placeholder="Edit Bio"
                  />
                ) : (
                  <p className={`${styles.bioTextArea}`}>{props.editedBio}</p>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className={"flex flex-grow"}>
          <div className={"flex-1 flex-col h-[18.5vh] w-[20vw] mt-[7vh] ml-[2vw] rounded-3xl border-2 border-maroon_new overflow-hidden text-[1.2vw]"}>
            {qnaItems.slice(0, 5)}
          </div>
          <div className={"flex-1 flex-col flex h-[31.5vh] mt-[2vh] mr-[3vw] ml-[3vw] rounded-3xl border-2 overflow-hidden text-[1.2vw]"}>
          </div>
          <div className={"flex-1 mx-0 mb-0 pt-[1vh] h-[31.5vh] mt-[2vh] mr-[2vw] rounded-3xl border-2 border-maroon_new text-[1.2vw]"}>
          {!editable && (
  <div className="flex flex-col">
    <div className="flex items-center text-center justify-center">
      {selectedTopFive === 'Custom' && (
        <h3 className="text-lg font-semibold mb-[1vh] ">My Top 5 {customCategory}</h3>
      )}
      {selectedTopFive !== 'Custom' && (
          <h3 className="text-lg font-semibold mb-[1vh] ">My Top 5 {selectedTopFive}</h3>
      )}    
    </div>
    <div>
      {selectedTopFive === 'Superheroes' && (
        <div>
          {topFiveSuperheroes.filter(item => item.trim() !== '').map((item, index) => (
            <div key={index} className={styles.topFiveItem}>
              <p>{index+1}. {item} </p>
            </div>
          ))}
        </div>
      )}
      {selectedTopFive === 'Movies' && topFiveMovies.filter(item => item.trim() !== '').map((item, index) => (
        <div key={index} className={styles.topFiveItem}>{index + 1}. {item}</div>
      ))}
      {selectedTopFive === 'Custom' && (
        <div>
          {topFiveCustom.filter(item => item.trim() !== '').map((item, index) => (
            <div key={index} className={styles.topFiveItem}>{index+1}. {item}</div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

            {editable && (
              <div className="flex flex-col">
                <select
                  value={selectedTopFive}
                  onChange={handleTopFiveChange}
                  className="mt-[1vh] mb-[1vh]"
                >
                  <option value="Superheroes">My Top 5 Superheroes</option>
                  <option value="Movies">My Top 5 Movies</option>
                  <option value="Custom">My Top 5 Custom</option>
                </select>
                {selectedTopFive === 'Movies' && (
                  <div>
                    {topFiveMovies.map((item, index) => (
                      <input
                        key={index + 1}
                        type="text"
                        onChange={(e) => handleTopFiveItemChange(index + 1, 'Movies', e.target.value)}
                        placeholder={`${index + 1}.`}
                        className="mt-[0.75vh] mb-[0.65vh] ml-[0.5vw]"
                      />
                    ))}
                  </div>
                )}
                {selectedTopFive === 'Superheroes' && (
                  <div>
                    {topFiveSuperheroes.map((item, index) => (
                      <input
                        key={index + 1}
                        type="text"
                        onChange={(e) => handleTopFiveItemChange(index + 1, 'Superheroes', e.target.value)}
                        placeholder={`${index + 1}.`}
                        className="mt-[0.65vh] mb-[0.65vh] ml-[0.5vw]"
                      />
                    ))}
                  </div>
                )}
                {selectedTopFive === 'Custom' && (
                  <div>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={handleCustomCategoryChange}
                      placeholder="My Top 5..."
                      className="mt-[0.25vh] ml-[1vw]"
                    />
                    {topFiveCustom.slice(0,5).map((item, index) => (
                      <input
                        key={index}
                        type="text"
                        onChange={(e) => handleTopFiveItemChange(index, 'Custom', e.target.value)}
                        placeholder={`${index + 1}.`}
                        className="mt-[0.25vh] ml-[2vw]"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="absolute bottom-[19vh] left-[13vw] w-[20%]">
            <span className="ml-[5vw]">Sleep Schedule</span>
            <InputRange
              draggableTrack
              maxValue={144}
              minValue={80}
              value={sliderValue}
              onChange={value => setSliderValue(value)}
              formatLabel={() => null}
              className={{
                slider: 'maroon',
                track: 'maroon',
                activeTrack: 'maroon',
                labelContainer: 'maroon',
              }}
            />
            <div className="flex justify-between">
              <span>{formatTime(sliderValue.min)}</span>
              <span>{formatTime(sliderValue.max)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

