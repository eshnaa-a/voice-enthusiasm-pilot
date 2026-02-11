/* ---------- Participant ID ---------- */
const urlParams = new URLSearchParams(window.location.search);
const PARTICIPANT_ID = urlParams.get('PID') || `P${Math.floor(Math.random() * 1e9)}`;

/*--------Confirmation code---------*/
const CONFIRMATION_CODE = "1CD32A66A5";

/* ---------- Initialize jsPsych ---------- */
const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: true,
    on_finish: () => {
        document.body.innerHTML = `<h2>Thank you!</h2><p>You have completed the experiment.</p>`;
    }
});

/* ---------- Stimuli Definitions ---------- */
const voices = [
    { id: "F1", gender: "female" },
    { id: "F2", gender: "female" },
    { id: "F3", gender: "female" },
    { id: "F4", gender: "female" },
    { id: "F5", gender: "female" },
    { id: "F6", gender: "female" },
    { id: "M1", gender: "male" },
    { id: "M2", gender: "male" },
    { id: "M3", gender: "male" },
    { id: "M4", gender: "male" },
    { id: "M5", gender: "male" },
    { id: "M6", gender: "male" }
];

const pitchLevels = ["low", "mid", "high"];

const pitchMap = { low: 1, mid: 2, high: 3 };

// Build all audio stimuli
let stimuli = [];
voices.forEach(voice => {
    pitchLevels.forEach(pitch => {
        stimuli.push({
            voice: voice.id,
            gender: voice.gender,
            pitch: pitch,
            file: `audio_files/${voice.gender.toLowerCase()}_voice${voice.id.slice(1)}_pitch${pitchMap[pitch]}.wav`
        });
    });

    // Add extra unsped low version for males only
    if (voice.gender === "male") {
        stimuli.push({
            voice: voice.id,
            gender: voice.gender,
            pitch: "low_unsped",
            file: `audio_files/${voice.gender.toLowerCase()}_voice${voice.id.slice(1)}_pitch4.wav`
        });
    }
    
});

/* ---------- Randomize and split into 3 blocks ---------- */
const shuffledStimuli = jsPsych.randomization.shuffle(stimuli);

const blockSize = Math.floor(shuffledStimuli.length / 3); // 42 / 3 = 14
const blocks = [
    shuffledStimuli.slice(0, blockSize),
    shuffledStimuli.slice(blockSize, blockSize*2),
    shuffledStimuli.slice(blockSize*2)
];

function createAudioRatingTrial(stimulus, blockNumber, totalBlocks) {
    return {
        type: jsPsychSurveyHtmlForm,
        preamble: `<p style="text-align:center;"><b>Please listen to the audio below:</b></p>`,
        html: `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 14px;
                color: #666;
                z-index: 1000;
            ">
                Block ${blockNumber} of ${totalBlocks}
            </div>

            <div style="display:flex; justify-content:center; margin-bottom:40px;">
                <audio id="audio-player" controls>
                    <source src="${stimulus.file}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>

            <p style="font-style:italic; color:#555; margin-bottom:10px;">
                Note: You must listen to the entire audio clip to see the questions.
            </p>

            <div id="rating-questions-${blockNumber}-${stimulus.voice}" style="display:none;">

                <div style="margin-bottom:30px;">
                    <p><b>On a scale of 1 to 7, how enthusiastic does this person sound to you?
                    (1 = Not enthusiastic at all, 7 = Very enthusiastic)</b></p>
                    ${[1,2,3,4,5,6,7].map(i => `
                        <label style="margin-right:10px;">
                            <input type="radio" name="enthusiasm" value="${i}" required> ${i}
                        </label>
                    `).join("")}
                </div>

                <div style="margin-bottom:30px;">
                    <p><b>On a scale of 1 to 7, how dominant does this person sound to you?
                    (1 = Not dominant at all, 7 = Very dominant)</b></p>
                    ${[1,2,3,4,5,6,7].map(i => `
                        <label style="margin-right:10px;">
                            <input type="radio" name="dominance" value="${i}" required> ${i}
                        </label>
                    `).join("")}
                </div>

            </div>
        `,
        button_label: "Submit",
        on_load: function() {
            const audio = document.getElementById("audio-player");
            const questions = document.getElementById(`rating-questions-${blockNumber}-${stimulus.voice}`);

            audio.playbackRate = 1.0;

            audio.addEventListener("ratechange", () => {
                audio.playbackRate = 1.0;
            });

            let maxPlayedTime = 0;

            audio.addEventListener("timeupdate", () => {
                if (!audio.seeking) {
                    maxPlayedTime = Math.max(maxPlayedTime, audio.currentTime);
                }
            });

            audio.addEventListener("seeking", () => {
                if (audio.currentTime > maxPlayedTime + 0.05) {
                    audio.currentTime = maxPlayedTime;
                }
            });

            audio.addEventListener("ended", () => {
                questions.style.display = "block";
            });
        },

        on_finish: function(data) {
            const responses = data.response;

            const trialData = {
                participant: PARTICIPANT_ID,
                voice: stimulus.voice,
                gender: stimulus.gender,
                pitch: stimulus.pitch,
                block: blockNumber,
                enthusiasm: parseInt(responses.enthusiasm),
                dominance: parseInt(responses.dominance),
                reaction_time: data.rt,
                timestamp: new Date().toISOString()
            };
            saveTrialData(trialData);
        }
    };
}

/* ---------- Build Timeline ---------- */
let timeline = [];

// Consent page
var consent_html = `
<div style="display:flex; justify-content:center;">
  <div id="consent-box" style="width: 80%; height: 1200px; margin: auto; border: 1px solid #ccc; padding: 20px; height: 300px; overflow-y: scroll;">
  <h2>Informed Consent</h2>


<p><strong>Researchers:</strong><br>
  Eshnaa Aujla, graduate student (eshnaa15@yorku.ca)<br>
  Supervisor: Vinod Goel, vgoel@yorku.ca</p>

  <p>We invite you to take part in this research study. Please read this document and discuss any questions or concerns that you may have with the Researchers.</p>

  <p><strong>Purpose of the Research:</strong> This project investigates the cognitive structures and processes underlying human reasoning & problem-solving abilities. The tasks involve attending to linguistic stimuli and making a perceptual or cognitive judgment on a computer screen.</p>

  <p><strong>What You Will Be Asked to Do:</strong> You will be asked to complete a self questionnaire. After listening to audios, you will be asked to make certain judgements.</p>

  <p><strong>Risks and Discomforts:</strong> We do not foresee any risks or discomfort from your participation in the research. You may, however, experience some frustration or stress if you believe that you are not doing well. Certain participants may have difficulty with some of the tasks. If you do feel discomfort you may withdraw at any time.</p>

  <p><strong>Benefits:</strong> There is no direct benefit to you, but knowledge may be gained that may help others in the future. The study takes approximately 15 minutes to complete, and you will receive $2.50 USD for your participation.</p>

  <p><strong>Voluntary Participation:</strong> Your participation is entirely voluntary and you may choose to stop participating at any time. Your decision will not affect your relationship with the researcher, study staff, or York University.</p>

  <p><strong>Withdrawal:</strong> You may withdraw at any time. If you withdraw, all associated data will be destroyed immediately.</p>

  <p><strong>Secondary Use of Data:</strong> De-identified data may be used in later related studies by the research team, but only in anonymous form and only following ethics review.</p>

  <p><strong>Confidentiality:</strong> All data will be collected anonymously. Data will be stored in a secure online system accessible only to the research team. Confidentiality cannot be guaranteed during internet transmission. Your data may be deposited in a publicly accessible scientific repository in fully anonymized form. No identifying information will be included.</p>

  <p><strong>Questions?</strong> For questions about the study, contact Dr. Vinod Goel or Eshnaa Aujla. For questions about your rights, contact York University's Office of Research Ethics at ore@yorku.ca.</p>

  <p><strong>Legal Rights and Signatures:</strong><br>
  By selecting “I consent to participate,” you indicate that you have read and understood the information above and agree to participate voluntarily.</p>
</div>
`

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: consent_html,
    choices: ["I consent to participate", "I do NOT consent to participate"],
    on_load: function() {
        let box = document.getElementById("consent-box");
        let buttons = document.querySelectorAll(".jspsych-btn");
        buttons.forEach(btn => btn.disabled = true);

        box.addEventListener("scroll", function() {
            if (box.scrollTop + box.clientHeight >= box.scrollHeight - 5) {
                buttons.forEach(btn => btn.disabled = false);
            }
        });
    },
    on_finish: function(data) {
        if (data.response === 1) { // user does NOT consent
            document.body.innerHTML = `
                <div style="width: 70%; margin: 100px auto; text-align: center;">
                    <h2>Consent Not Given</h2>
                    <p>You chose not to provide consent. The study has ended.</p>
                </div>`;
            jsPsych.endExperiment();
        }
    }
});

// ---------- Demographic Questions ----------
const demographicsTrial = {
    type: jsPsychSurveyHtmlForm,
    preamble: `<h2>Demographic Information</h2>
               <p>Please answer the following questions:</p>`,
    html: `
        <p>
            <label>1. What is your age?</label><br>
            <input name="age" type="number" min="18" required>
        </p>

        <p>
            <label>2. What is your gender?</label><br>
            <select name="gender" required>
                <option value="" disabled selected>-- Please select --</option>
                <option value="woman">Woman</option>
                <option value="man">Man</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_say">Prefer not to say</option>
                <option value="other">Other</option>
            </select>
        </p>

        <p>
            <label>3. How would you describe your ethnicity?</label><br>
            <select name="ethnicity" required>
                <option value="" disabled selected>-- Please select --</option>
                <option value="white">White</option>
                <option value="black">Black or African descent</option>
                <option value="east_asian">East Asian</option>
                <option value="south_asian">South Asian</option>
                <option value="southeast_asian">Southeast Asian</option>
                <option value="latinx">Latinx / Hispanic</option>
                <option value="middle_eastern">Middle Eastern</option>
                <option value="indigenous">Indigenous</option>
                <option value="mixed">Mixed</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
            </select>
        </p>

        <p>
            <label>4. What is your current employment status?</label><br>
            <select name="employment" required>
                <option value="" disabled selected>-- Please select --</option>
                <option value="employed_full_time">Employed full-time</option>
                <option value="employed_part_time">Employed part-time</option>
                <option value="self_employed">Self-employed</option>
                <option value="student">Student</option>
                <option value="student_and_employed">Student and Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
        </p>

        <p>
            <label>5. What is your current religious or spiritual affiliation?</label><br>
            <select name="religion" required>
                <option value="" disabled selected>-- Please select --</option>
                <option value="christian">Christian</option>
                <option value="muslim">Muslim</option>
                <option value="jewish">Jewish</option>
                <option value="hindu">Hindu</option>
                <option value="buddhist">Buddhist</option>
                <option value="sikh">Sikh</option>
                <option value="other_spirituality">Other / Spirituality</option>
                <option value="none_atheist_agnostic">None / Atheist / Agnostic</option>
                <option value="prefer_not_say">Prefer not to say</option>
            </select>
        </p>

        <p>
            <label>6. What is your highest level of education completed?</label><br>
            <select name="education" required>
                <option value="" disabled selected>-- Please select --</option>
                <option value="high_school">High School</option>
                <option value="some_college_university">Some college / university</option>
                <option value="undergraduate">Undergraduate degree</option>
                <option value="graduate">Graduate degree</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
        </p>

        <p>
          <label>
            7. Please enter your CloudResearch Connect ID:
            <br>
            <input
              name="connect_id"
              type="text"
              required
              style="width: 300px;"
            >
          </label>
        </p>

    `,
    button_label: "Continue",
    on_finish: function(data) {
        const responses = data.response;
        const demoData = {
            participant: PARTICIPANT_ID,
            age: parseInt(responses.age),
            gender: responses.gender,
            ethnicity: responses.ethnicity,
            employment: responses.employment,
            religion: responses.religion,
            education: responses.education,
            connect_id: responses.connect_id,
            timestamp: new Date().toISOString()
        };
        saveTrialData(demoData); // logs the data
    }
};

// Add this trial before your instructions in the timeline
timeline.push(demographicsTrial);

// Instructions
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <h2>Welcome to the Experiment!</h2>
        <p>You will hear a series of brief voice recordings in which individuals describe the contents of their job portfolio. The recordings will be evenly divided into three experiment blocks.</p>
        <p>After each recording, you will be asked to rate how <b>enthusiastic</b> and how <b>dominant</b> the speaker sounds on a scale of 1–7.</p>
        <p>You may use either the computer speaker or headphones to complete this study. Please ensure you are in a quiet space.</p>
        <p>If you wish to stop at any point, simply close this page and your data will not be recorded.</p>
        <p>Press <strong>SPACE</strong> to begin.</p>
    `,
    choices: [" "]
});

// Loop through blocks
blocks.forEach((blockStimuli, index) => {
    // Block start page
    timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<h2>You are now beginning Block ${index + 1} of ${blocks.length}</h2><p>Press <strong>SPACE</strong> to begin.</p>`,
        choices: [" "]
    });

    // Add trials for this block
    blockStimuli.forEach(stimulus => {
        timeline.push(
            createAudioRatingTrial(stimulus, index + 1, blocks.length)
        );
    });

    // Add break screen after each block (except the last)
    if (index < blocks.length - 1) {
        timeline.push({
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <h2>End of Block ${index + 1}</h2>
                <p>You may take a short break if needed.</p>
                <p>When you are ready to continue, press <strong>SPACE</strong>.</p>
            `,
            choices: [" "]
        });
    }
});

// Final thank-you page
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <h2>Thank you for participating!</h2>
        <p>You have completed the experiment.</p>

        <div style="
            margin-top: 30px;
            padding: 20px;
            border: 2px dashed #333;
            display: inline-block;
            font-size: 20px;
            font-weight: bold;
        ">
            Confirmation Code: ${CONFIRMATION_CODE}
        </div>

        <p style="margin-top: 20px;">
            Please copy and paste the above code into CloudResearch to confirm your participation.
        </p>
    `,
    choices: "NO_KEYS",
    trial_duration: 15000
});

/* ---------- Run Experiment ---------- */
jsPsych.run(timeline);