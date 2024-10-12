import {AppBar, Typography} from '@material-ui/core'
import VideoPlayer from './Components/VideoPlayer'
import Options from './Components/Sidebar'
import Notifications from './Components/Notifications'
import { makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles((theme) => ({
  appBar: {
    borderRadius: 15,
    margin: '30px 100px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '600px',
    border: '2px solid black',

    [theme.breakpoints.down('xs')]: {
      width: '90%',
    },
  },
  image: {
    marginLeft: '15px',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
}));

function App() {

  const classes = useStyles()

  return (
    <div className={classes.wrapper}>
     <AppBar position='static' color='inherit' className={classes.appBar} >
      <Typography variant='h2' align='center'>Video Player</Typography>
     </AppBar>
     <VideoPlayer/>
      <Options>
        <Notifications/>
      </Options>
    </div>
  )
}

export default App
