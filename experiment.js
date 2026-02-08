/* ---------- Participant ID ---------- */
const urlParams = new URLSearchParams(window.location.search);
const PARTICIPANT_ID = urlParams.get('PID') || `P${Math.floor(Math.random() * 1e9)}`;

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
});

/* ---------- Randomize and split into 3 blocks ---------- */
const shuffledStimuli = jsPsych.randomization.shuffle(stimuli);

const blockSize = shuffledStimuli.length / 3; // 36 / 3 = 12
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

  <p><strong>Benefits:</strong> There is no direct benefit to you, but knowledge may be gained that may help others in the future. The study takes approximately ___ minutes to complete, and you will receive ____ USD for your participation.</p>

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

// Instructions
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <h2>Welcome to the Experiment!</h2>
        <p>You will hear a series of short voice recordings, divided into three blocks.</p>
        <p>After each recording, you will be asked to rate how <b>enthusiastic</b> and how <b>dominant</b> the speaker sounds on a scale of 1–7.</p>
        <p>You may use either the computer speaker or headphones to complete this study. Please ensure you are in a quiet space.</p>
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
});

// Final thank-you page
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<h2>Thank you for participating!</h2><p>You have completed the experiment.</p>`,
    choices: "NO_KEYS",
    trial_duration: 4000
});

/* ---------- Run Experiment ---------- */
jsPsych.run(timeline);

