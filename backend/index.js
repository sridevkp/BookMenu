const express = require('express')
const cors = require('cors')

const { cache, fetchSitePreview } = require("./func.js")
const port = process.env.PORT || 3000

const app = express()
app.use(cors())


app.get('/preview', cache, async (req, res) => {
  const { url } = req.query ;
  if( !url ) return res.sendStatus(400);
  try{
      const preview = await fetchSitePreview( url )
      res.status(200).json(preview) ;
  }
  catch( err ){
    console.log(err)
    res.sendStatus(500)
  }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})