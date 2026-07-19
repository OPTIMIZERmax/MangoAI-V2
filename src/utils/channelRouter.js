export const channelModes = {

  // replace these with your real channel IDs

  "SPARX_MATHS_CHANNEL_ID": {
    platform: "sparxMaths",
    subject: "maths"
  },

  "SPARX_SCIENCE_CHANNEL_ID": {
    platform: "sparxMaths",
    subject: "science"
  },

  "SPARX_READER_CHANNEL_ID": {
    platform: "sparxMaths",
    subject: "reader"
  },

  "EDUCAKE_CHANNEL_ID": {
    platform: "educake"
  },

  "DRFROST_CHANNEL_ID": {
    platform: "drfrost"
  },

  "AI_HOMEWORK_CHANNEL_ID": {
    platform: "bedrock"
  }

};


export function getChannelMode(channelId){

  return channelModes[channelId] || null;

}