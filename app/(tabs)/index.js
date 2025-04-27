import { useEffect, useState, useRef } from "react";
import {
  width,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  TextInput,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as AuthSession from "expo-auth-session";
import * as FileSystem from "expo-file-system";
import ViewShot, { captureRef } from "react-native-view-shot";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import chargersData from "../../assets/chargers.json";
import FAB from "../../components/FAB";

WebBrowser.maybeCompleteAuthSession(); // Important line

const CLIENT_ID =
  "113391121275-8uqs7grodlrq1iartr5h8rj32e0o1er2.apps.googleusercontent.com"; // your web client ID
// const REDIRECT_URI = makeRedirectUri({ useProxy: true });
const REDIRECT_URI =
  "com.googleusercontent.apps.113391121275-8uqs7grodlrq1iartr5h8rj32e0o1er2.apps.googleusercontent.com:/oauth2redirect";
// const REDIRECT_URI = AuthSession.makeRedirectUri({
//       // For production, use:
//     native: "https://auth.expo.io/@ev-charger-app/ev-charger-app",
//   useProxy: true,
// });
// const REDIRECT_URI = "https://auth.expo.io/@ev-charger-app/ev-charger-app";
console.log(REDIRECT_URI, "line no 18");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export default function HomeScreen() {
  const { width } = Dimensions.get("window");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewShotRef = useRef(null);
  const [accessToken, setAccessToken] = useState(null);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      usePKCE: false,
    },
    DISCOVERY
  );

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Cool Photo App Camera Permission",
          message:
            "Cool Photo App needs access to your camera " +
            "so you can take awesome pictures.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the location");
      } else {
        console.log("location permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestCameraPermission();
    const getCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location.coords);
        setLoading(false);
      } else {
        Alert.alert("Permission denied to access location.");
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      setAccessToken(response.authentication.accessToken);
    }
  }, [response]);

  const handleFABPress = async () => {
    if (!accessToken) {
      console.log("No access token, requesting auth...");
      await promptAsync({ useProxy: true });
      return;
    }

    if (!viewShotRef.current) {
      Alert.alert("Screenshot area not ready yet. Please wait...");
      return;
    }

    try {
      const uri = await captureRef(viewShotRef.current, {
        format: "webp",
        quality: 0.9,
      });

      console.log("Captured Screenshot URI (temp):", uri);

      const fileName = `screenshot_${Date.now()}.webp`;
      const newPath = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      });

      console.log("Saved Screenshot at:", newPath);

      await uploadToGoogleDrive(newPath, accessToken);

      Alert.alert("Screenshot captured and uploaded successfully!");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      Alert.alert("Failed to capture screenshot");
    }
  };

  const renderChargerCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name.slice(0, 25)}...</Text>
      <Text style={styles.address}>
        {item.address},{item.distance}meters
      </Text>
      <Text style={styles.subTitle}>SUPPORTED CONNECTOR</Text>
      {item?.connector_types.map((connector, index) => {
        const [type, count] = connector.split("-");
        let formattedType = "";

        // Format the connector type
        if (type === "lvl1dc") {
          formattedType = "Level 1 DC";
        } else if (type === "lvl2dc") {
          formattedType = "Level 2 DC";
        } else if (type === "normalac") {
          formattedType = "Normal AC";
        }

        return (
          <View key={index}>
            <Text style={styles.connectorText}>• {formattedType}</Text>
            <Text style={styles.connectorText}>
              Connectors available: {count}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
      ) : location ? (
        <>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "webp", quality: 0.9 }}
            style={{ flex: 1 }}
          >
            {location?.latitude && location?.longitude ? (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="You"
                  description="Current Location"
                />

                {chargersData?.chargers?.map((charger) => (
                  <Marker
                    key={charger.id}
                    coordinate={{
                      latitude: parseFloat(charger.latitude),
                      longitude: parseFloat(charger.longitude),
                    }}
                    title={charger.name}
                    description={charger.address}
                    pinColor="green"
                  />
                ))}
              </MapView>
            ) : (
              <Text>Loading map...</Text>
            )}
          </ViewShot>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.menuButton}>
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 24,
                  padding: "3px",
                }}
              >
                ≡
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.searchInput}
              placeholder="Search for the compatible chargers"
              placeholderTextColor="#ccc"
            />
          </View>

          {/* Charger Cards List */}
          <View style={styles.cardListContainer}>
            <FlatList
              data={chargersData.chargers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderChargerCard}
            />
          </View>

          <FAB onPress={handleFABPress} />
        </>
      ) : (
        <Text>Unable to fetch location.</Text>
      )}
    </View>
  );
}

async function uploadToGoogleDrive(fileUri, accessToken) {
  try {
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const responseUpload = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/related; boundary=foo_bar_baz",
        },
        body: `--foo_bar_baz
Content-Type: application/json; charset=UTF-8

{
  "name": "screenshot.webp"
}

--foo_bar_baz
Content-Type: image/webp
Content-Transfer-Encoding: base64

${fileBase64}
--foo_bar_baz--`,
      }
    );

    const data = await responseUpload.json();
    console.log("Upload Success. File ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    throw error;
  }
}

const styles = StyleSheet.create({
  cardListContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    paddingLeft: 10,
  },
  card: {
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    minHeight: 300,
    flex: 1,
  },

  subTitle: {
    color: "#42f5da",
    fontWeight: "bold",
  },
  connectorText: {
    color: "#42e3f5",
    marginTop: 2,
    fontSize: 14,
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  searchText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  menuButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
  },
  marker: {
    backgroundColor: "#34c759",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    color: "white",
    fontWeight: "bold",
  },

  title: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  address: {
    marginTop: 8,
    color: "gray",
  },

  topBar: {
    position: "absolute",
    top: 70,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 10,
  },

  menuButton: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 10,
    color: "black",
  },
});
