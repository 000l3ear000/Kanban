import React, { useState, useEffect } from 'react';
import SweetAlert from 'react-native-sweet-alert';
import { TextInput, } from 'react-native-gesture-handler';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../consts/colors';
import staticImgs from '../helper/images_path';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Spinner from 'react-native-loading-spinner-overlay';
import Geolocation from '@react-native-community/geolocation'

import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Alert,
  TouchableOpacity,
  LogBox

} from 'react-native';



const width = Dimensions.get('window').width / 2 - 30;
LogBox.ignoreLogs(['new NativeEventEmitter']);

const RNFS = require("react-native-fs");
const ip = "http://40.86.119.115:8080"


const HomeScreen = ({ navigation }) => {
  const [imageUri, setimageUri] = useState("");
  const [catergoryIndex, setCategoryIndex] = useState(0);
  const [searchText, setsearchText] = useState("");
  const [result, setResult] = useState(1);
  const [result1, setResult1] = useState(0);
  const [favIconColor, setFavIconColor] = useState(false);
  const [loc, setloc] = useState([0, 0]);
  const [city, setcity] = useState("");
  const [dataPlants, setDataPlants] = useState([]);
  const [storageFlowers, setStorageFlowers] = useState([]);
  const [locationFlowers, setLocationFlowers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [flag, setFlag] = useState(0);
  const [spinnerState, setSpinnerState] = useState(false);
  const [locationSpinner, setLocationSpinner] = useState(false);
  const [locationFlowersFlag, setLocationFlowersFlag] = useState(false);


  const categories = ['ALL FLOWERS', 'FAVORITES', <Icon name='location-pin' size={24} onPress={ async () => await getLocationBasedFlowers() } />];


  const [toggle, settoggle] = useState(0);

  useEffect(() => {
    getLoc();
    // console.log("Iam key>>>>>>>>>:", process.env.LOCATION_KEY);
  }, []);


  useEffect(() => {
    if (imageUri) {
      setModalVisible(true);
      // console.log("setting up and opening modal", imageUri.uri.split(",")[1])
    }

  }, [imageUri])

  useEffect(() => {
    console.log("pressed")
  }, [toggle])

  useEffect(() => {
    console.log(searchText)
  }, [searchText])

  useEffect(() => {
    if ( locationFlowers.length > 0 ) {
      console.log('YES I AM GRETTT');
      setLocationFlowersFlag(true);
    }
  }, [locationFlowers])

  const storeData = async (value) => {
    try {
      await AsyncStorage.setItem('@flowers', JSON.stringify(value))
    } catch (e) {
      console.log("Error storing data: ", e);
    }
  }


  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('@flowers')
      if (value !== null && JSON.parse(value).length > 0) {
        return JSON.parse(value);
      } else return [];
    } catch (e) {
      console.log("Error getting data: ", e);
    }
  }

  const getLoc = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log(position)
        setloc([position.coords.latitude, position.coords.longitude])
      },
      (error) => {
        console.log(error)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  useEffect(() => {
    if (loc[0] != 0 && loc[1] != 0) {
      // console.log(`https://us1.locationiq.com/v1/reverse.php?key=pk.e7b21944426abbf3916d6c91f77c96b2&lat=${loc[0]}&lon=${loc[1]}&format=json`)
      fetch(`https://us1.locationiq.com/v1/reverse.php?key=pk.e7b21944426abbf3916d6c91f77c96b2&lat=${loc[0]}&lon=${loc[1]}&format=json`)
        .then(res => res.json())
        .then(res => {
          // console.log(res.address)
          setcity(res.address.state)
        })
    }
  }, [loc]);




  useEffect(() => {
    setSpinnerState(!spinnerState);
    // AsyncStorage.removeItem('@flowers')
    const getFlowers = async () => {
      await fetch("http://40.86.119.115:8080/all_flowers")
        .then(res => res.json())
        .then(async res => {
          let temp = res['flowers'];
          let checkStoredFlowerData = await getData();
          if (checkStoredFlowerData.length > 0) {
            let updatedFlowerArray = [];
            temp.forEach(flower => {
              const flowerObj = checkStoredFlowerData.filter(item => item.flower_name === flower.flower_name);
              if (flowerObj.length === 1) updatedFlowerArray.push({ ...flower, like: flowerObj[0]["like"] });
              else console.log("No such flower obj found in storge", flower);
            })
            for (let i = 0; i < staticImgs.length; i++) {
              updatedFlowerArray[i]["img"] = staticImgs[i];
            }
            setDataPlants(updatedFlowerArray);
            setStorageFlowers(updatedFlowerArray);
            setSpinnerState(false);
          } else {
            for (let i = 0; i < staticImgs.length; i++) {
              temp[i]["img"] = staticImgs[i];
            }
            temp.forEach(flower => flower['like'] = false);
            setDataPlants(temp);
            setStorageFlowers(temp);
            setSpinnerState(false);
          }
        })
        .catch(error => console.log(error))
    }
    getFlowers();

    return () => { 
      setDataPlants([]);
      setStorageFlowers([]);
      setLocationFlowers([]);
    }
  }, [])

  const changeFlowerArray = async (plantObj) => {
    if (dataPlants.length > 0 && storageFlowers.length > 0) {
      let index = storageFlowers.findIndex(item => item.flower_name === plantObj.flower_name);
      storageFlowers.splice(index, 1);
      storageFlowers.splice(index, 0, plantObj);
      await storeData(storageFlowers);
    }
  }

  const getLocationBasedFlowers = async () => {
    setLocationSpinner(!locationSpinner);
    setCategoryIndex(2);
    if ( city !== '' ) {
    await fetch(`${ip}/location_flowers`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
  
        body: JSON.stringify({
          // city
          city: "Lahore",
        })
  
      })
      .then(res => res.json())
      .then(res => {
        let flowersTemp = [];
        res['flowers'].forEach(flower => {
          let filteredFlowers = dataPlants.filter(item => item.flower_name.toLowerCase() === flower.toLowerCase());
          if ( filteredFlowers.length === 1 ) flowersTemp.push(filteredFlowers[0]);
        })
        if ( flowersTemp.length > 0 ) { setLocationFlowers(flowersTemp); setLocationSpinner(false) }
        else console.log("No location flowers were found");
      });
    }
  }

  const CategoryList = () => {
    return (
      <View style={style.categoryContainer}>
        {categories.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => { setCategoryIndex(index); setLocationFlowersFlag(false); setLocationFlowers([]); setLocationSpinner(false); }}>
            <Text
              style={[
                style.categoryText,
                catergoryIndex === index && style.categoryTextSelected,
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };



  const Card = ({ plant }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Details', plant)}
      >
        <View style={style.card}>
          <View style={{ alignItems: 'flex-end' }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                zIndex: 1,
                top: 8,
                right: 8,
                backgroundColor: plant.like
                  ? 'rgba(245, 42, 42,0.6)'
                  //? 'rgba(245, 42, 42,0.2)'
                  //: 'rgba(0,0,0,0.2) ',
                  : 'rgba(255,255,255,0.6) ',
                marginBottom: 5
              }}>
              <TouchableOpacity
                onPress={() => { plant.like = !plant.like; settoggle(!toggle) }}
              >
                <Icon
                  name="favorite"
                  size={18}
                  onPress={() => { plant.like = !plant.like; setFavIconColor(!favIconColor); changeFlowerArray(plant) }}
                  color={plant.like ? COLORS.red : COLORS.black}
                />
              </TouchableOpacity>

            </View>
          </View>

          <View style={{ width: '100%'/*, alignItems: 'center' */ }} >
            <View
              style={{
                height: 140,
                width: 140,
                //position: 'absolute',
                // alignItems: 'flex-end',
                // borderWidth: 1
              }}
            >
              <Image
                source={plant["img"]}
                style={{ flex: 1, resizeMode: 'cover', width: 140, height: 140, borderRadius: 7 }}
              />
            </View>

            <Text style={{ fontWeight: 'bold', fontSize: 17, marginTop: 10 }}>
              {plant.flower_name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 5,
              }}>
              <Text style={{ fontSize: 19, fontWeight: 'bold' }}>
                {plant.botanical_name}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const openCamara = () => {
    const options = {
      storageOptions: {
        path: 'images',
        mediaType: 'photo',
      },
      includeBase64: true,
    };

    launchCamera(options, response => {
      setimageUri("")
      console.log(response);
      // console.log('Response = ', response.assets[0].base64);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        // You can also display the image using data:
        // const source = {uri: 'data:image/jpeg;base64,' + response.base64};
        // source={uri:source};
        const con = response.assets[0].base64
        // const { uri } = response;
        const source = { uri: "data:image/jpeg;base64," + con }
        setFlag(0);
        setimageUri(source);
      }
    });
  };

  const openGallery = () => {
    let options = {
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, response => {
      setimageUri("")
      console.log('Response = ', response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
        alert(response.customButton);
      } else {
        var con = response.assets[0].uri;

        RNFS.readFile(con, 'base64')
          .then(res => {
            console.log(res);
            const source = { uri: "data:image/jpeg;base64," + res }
            setimageUri(source)
            setFlag(1);
          });
        // const { uri } = response;
      }
    });
  };

  const sendReq = () => {
    setResult(0)
    fetch(`${ip}/flower_image`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },

      body: JSON.stringify({
        img_uri: imageUri.uri.split(',')[1]
      })

    })
      .then((res) =>
        res.json()
      )
      .then((res) => {
        if (res.status) {
          const arr = res.flower_data;
          const obj = {}
          console.log(res);
          console.log(arr);
          arr.forEach((e) => {
            if (obj[e]) {
              obj[e] += 1;
            }
            else {
              obj[e] = 1
            }
          })
          console.log("holaaa", obj);
          const keys = Object.keys(obj)
          var greater = ""
          var temp = 1
          keys.forEach((e) => {
            if (obj[e] >= temp) {
              temp = obj[e]
              greater = e
            }
          })
          console.log("94%", greater);
          setResult1(greater.toUpperCase());
        }
        else {
          console.log("err");
        }
      })
      .catch((err) => {
        setModalVisible(0);
        console.log(err);

        SweetAlert.showAlertWithOptions({
          title: "Can't connect to server!",
          subTitle: 'Something went wrong',
          confirmButtonTitle: 'OK',
          confirmButtonColor: '#000',
          otherButtonTitle: 'Cancel',
          otherButtonColor: '#dedede',
          style: 'danger',
          cancellable: true
        },
          callback => console.log('callback'));

      })

  }

  const openDetails = (prop) => {
    setModalVisible(false)
    setResult(1);
    setResult1("")
    var dat = prop
    const data = dataPlants.filter(flower => flower.flower_name.toLowerCase() === dat.toLowerCase())
    console.log(data);
    if (data.length > 0) {
      navigation.navigate("Details", data[0])
    }
    else {
      console.log("smol");
    }

  }

  const modl = () => {
    return (
      <View style={{ width: '100%', height: '100%', alignItems: "center", justifyContent: 'center' }}>

        <View style={{ height: '50%', marginTop: "20%", borderWidth: 1, borderColor: 'gray', borderRadius: 30, alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'white', width: '90%' }}>
          {result1 ?
            <>
              <View style={{ height: "75%", width: '90%', justifyContent: 'flex-end' }}>
                <Image
                  source={imageUri ? imageUri : 0}
                  // source={{ uri: "file:///data/user/0/com.helloplant/cache/rn_image_picker_lib_temp_851c4a90-4222-4889-a792-989a17aa40cb.jpg" }}
                  style={{
                    height: "95%",
                    width: "100%",

                  }} />
              </View>
              <Text style={{ fontSize: 16, color: "black" }}>{result1}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-evenly', }}>
                <Icon style={{ height: 28 }} name='dangerous' size={28} onPress={() => { setModalVisible(false); setResult1(""); setResult(1) }} />

                <TouchableOpacity onPress={() => openDetails(result1)}>
                  <View style={{ backgroundColor: 'green', margin: 0, justifyContent: 'center', alignItems: 'center', width: width, height: 40 }}>
                    <Text style={{ color: 'white' }}>
                      More Details
                    </Text>
                  </View>
                </TouchableOpacity>
                <Icon style={{ height: 28 }} name='replay' size={28} onPress={() => { flag ? launchImageLibrary() : launchCamera(); setResult("1"); setimageUri("") }} />
              </View>
            </>
            :
            <>
              <View style={{ height: "80%", width: '90%', justifyContent: 'flex-end' }}>
                <Image
                  source={imageUri ? imageUri : 0}
                  // source={{ uri: "file:///data/user/0/com.helloplant/cache/rn_image_picker_lib_temp_851c4a90-4222-4889-a792-989a17aa40cb.jpg" }}
                  style={{
                    height: "95%",
                    width: "100%",

                  }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-evenly', }}>
                <Icon style={{ height: 28 }} name='dangerous' size={28} onPress={() => { setModalVisible(false); setResult(1); setResult1("") }} />

                {
                  result ?
                    <TouchableOpacity onPress={() => sendReq()}>
                      <View style={{ backgroundColor: 'green', margin: 0, justifyContent: 'center', alignItems: 'center', width: width, height: 40 }}>
                        <Text style={{ color: 'white' }}>
                          Confirm
                        </Text>
                      </View>
                    </TouchableOpacity>
                    :
                    <Image
                      source={require("../assets/load.gif")}
                      style={{
                        width: width,
                        height: 40
                      }}
                    >

                    </Image>

                }
                <Icon style={{ height: 28 }} name='replay' size={28} onPress={() => { flag ? launchImageLibrary() : launchCamera(); setResult(1) }} />
              </View>
            </>
          }
        </View>
      </View>

    )
  }

  const switchScreens = (index) => {
    switch (index) {
      case 0:
        return (
          <FlatList
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              marginTop: 10,
              paddingBottom: 50,
            }}
            numColumns={2}
            data={dataPlants.filter(plant => plant.flower_name.toLowerCase().includes(searchText.toLowerCase()))}
            // data={dataPlants}
            renderItem={({ item }) => {
              return <Card plant={item} />;
            }}
          />
        )
      case 1:
        return (
          <FlatList
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              marginTop: 10,
              paddingBottom: 50,
            }}
            numColumns={2}
            // data={dataPlants}
            data={dataPlants.filter(plantItem => plantItem.like).filter(plant => plant.flower_name.toLowerCase().includes(searchText.toLowerCase()))}
            renderItem={({ item }) => {
              return <Card plant={item} />;
            }}
          />
        )
    }
  }


  return (
    <SafeAreaView
      style={{ flex: 1, paddingHorizontal: 20, backgroundColor: COLORS.white, paddingTop: 0 }}>
      <View style={style.header}>
        <View>
          <Text style={{ fontSize: 25, fontWeight: 'bold' }}>FYP Project</Text>
          <Text style={{ fontSize: 38, color: COLORS.green, fontWeight: 'bold' }}>
            Hello Plant!
          </Text>
        </View>
        <Icon style={{ height: 28 }} name='info' size={28} onPress={() => navigation.navigate("Info")} />
        <Icon style={{ height: 28 }} name='photo' size={28} onPress={() => openGallery()} />
        <Icon style={{ height: 28 }} name='camera-alt' size={28} onPress={() => { openCamara() }} />
      </View>

      <Modal
        animationType="slide"
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
        }}
        onDismiss={() => {
          console.log('dismiss');
          setModalVisible(false);
        }}
      >

        { modl() }

      </Modal>

      <View style={{ marginTop: 30, flexDirection: 'row' }}>
        <View style={style.searchContainer}>
          <Icon name="search" size={25} style={{ marginLeft: 20 }} />
          <TextInput placeholder="Search" value={searchText} onChangeText={(e) => { setsearchText(e) }} style={style.input} />
        </View>
      </View>
      <CategoryList />
      {
        dataPlants.length > 0 && catergoryIndex === 0 || 1 ?
          switchScreens(catergoryIndex) :
          null
      }
      { locationFlowersFlag ? (
        <FlatList
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            marginTop: 10,
            paddingBottom: 50,
          }}
          numColumns={2}
          data={locationFlowers.filter(plant => plant.flower_name.toLowerCase().includes(searchText.toLowerCase()))}
          // data={locationFlowers}
          renderItem={({ item }) => {
            return <Card plant={item} />;
          }}
        />
      ) : (<></>) }
      {spinnerState && (
        <Spinner
          visible={spinnerState}
          textContent={'Loading...'}
          textStyle={style.spinnerTextStyle}
        />
      )}
      {locationSpinner && (
        <Spinner
          visible={locationSpinner}
          textContent={'Getting your flowers...'}
          textStyle={style.locationSpinnerTextStyle}
        />
      )}
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  categoryContainer: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 20,
    justifyContent: 'space-between',
    margin: 30
  },
  categoryText: { fontSize: 18, color: 'grey', fontWeight: 'bold' },
  categoryTextSelected: {
    color: COLORS.green,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderColor: COLORS.green,
  },
  card: {
    height: 270,
    backgroundColor: COLORS.light,
    width,
    marginHorizontal: 2,
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchContainer: {
    height: 50,
    backgroundColor: COLORS.light,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: COLORS.dark,
  },
  sortBtn: {
    marginLeft: 10,
    height: 50,
    width: 50,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerTextStyle: {
    color: '#FFF'
  },
  locationSpinnerTextStyle: {
    color: '#FF0000'
  },
});

export default HomeScreen;
