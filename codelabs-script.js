const { google } = require('googleapis')
const { execSync } = require('child_process')
const drive = google.drive('v3')

const generateCodeLabs = async () => {
  if (process.env.NODE_ENV === 'development') return //run 'yarn build' the first time you test locally to generate labs; after than skip while doing dev.
  const jwtClient = new google.auth.JWT(
    process.env.GOOG_SA_EMAIL,
    null,
    process.env.GOOG_SA_KEY.replace(/\\n/gm, '\n'),
    ['https://www.googleapis.com/auth/drive.readonly'],
    null
  )
  await jwtClient.authorize()
  const { token } = await jwtClient.getAccessToken()
  const { data } = await drive.files.list({
    auth: jwtClient,
    q: `'${process.env.GOOG_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document'`,
  })
  data.files.forEach(({ id }) => execSync(`~/go/bin/claat export -o "./static/lab-content" -auth "${token}" ${id}`))
}

module.exports.generateCodeLabs = generateCodeLabs
