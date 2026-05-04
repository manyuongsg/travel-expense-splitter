import * as React from "react";
import { Text, View, TextInput, Pressable } from "react-native";
import {
  NavigationContainer,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Create Different Screens As Components
//1. Login Screen
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when screen loses focus (back button pressed)
        setEmail("");
        setPassword("");
        setIsLoggedIn(false);
      };
    }, [])
  );

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
      }}
    >
      <Text style={{ flex: 1, fontSize: 30, fontWeight: "bold" }}>
        Split and Share
      </Text>

      <View
        style={{
          flex: 3,
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            width: "70%",
            justifyContent: "space-between",
            borderRadius: 10,
            borderColor: "black",
            borderWidth: 1,
          }}
        >
          <Text style={{ padding: 10, borderRadius: 5 }}>Email:</Text>
          <TextInput
            style={{
              padding: 10,
              borderRadius: 5,
              alignItems: "center",
            }}
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            width: "70%",
            justifyContent: "space-between",
            borderRadius: 10,
            borderColor: "black",
            borderWidth: 1,
            marginTop: 10,
          }}
        >
          <Text style={{ padding: 10, borderRadius: 5 }}>Password:</Text>
          <TextInput
            style={{
              padding: 10,
              borderRadius: 5,
              alignItems: "center",
            }}
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
            }}
          />
        </View>
        <Pressable
          style={{
            backgroundColor: "#f7a072",
            color: "black",
            padding: 10,
            borderRadius: 5,
            marginTop: 10,
            width: "50%",
            alignItems: "center",
          }}
          onPress={() => {
            if (email === "admin" && password === "admin") {
              setIsLoggedIn(true);
              Toast.show({
                type: "success",
                text1: "Login successful",
                position: "bottom",
                visibilityTime: 2000,
              });
              navigation.navigate("Tab Navigator", {
                screen: "My Account",
                params: { name: "Admin" },
              }); // Navigate to Tab Navigator instead of "Home"
            } else {
              setIsLoggedIn(false);
              Toast.show({
                type: "error",
                text1: "Invalid email or password",
                position: "bottom",
                visibilityTime: 2000,
              });
            }
          }}
        >
          <Text style={{ color: "black" }}>Sign In</Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: "lightgray",
            color: "black",
            padding: 10,
            borderRadius: 5,
            marginTop: 10,
            width: "50%",
            alignItems: "center",
          }}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={{ color: "black" }}>Continue as Guest</Text>
        </Pressable>
      </View>
    </View>
  );
}

//2. Home Screen
function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to Manyu's App</Text>
    </View>
  );
}

function Feed() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Feed!</Text>
    </View>
  );
}

//3. Article Screen
function Article() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Article!</Text>
    </View>
  );
}

//4. Account Screen
function AccountScreen({ route }) {
  const { name } = route.params || { name: "Default Name" };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Wecome Back!</Text>
      <Text>{name}</Text>
    </View>
  );
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

//5. Tab Navigator
const Tab = createBottomTabNavigator();

const TabNavigator = ({route}) => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: "#e91e63",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={Feed}
        options={{
          tabBarLabel: "Feed",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="rss-feed" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Article"
        component={Article}
        options={{
          tabBarLabel: "Article",
          tabBarIcon: ({ size, color }) => (
            <MaterialIcons name="article" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="My Account"
        component={AccountScreen}
        initialParams={route?.params}  // Forward the params here from stack to tab navigation. The ? is called optional chaining operator. it is used to access nested properties when we are not sure if the parent object exist.
        options={{
          tabBarLabel: "Account",
          tabBarIcon: ({ size, color }) => (
            <MaterialIcons name="account-box" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

//6. Stack Navigator
const Stack = createStackNavigator();

//7. Main Component
function SplitandShareApp() {
  const [appIsReady, setAppIsReady] = useState(false);

  //trying out splash screen
  useEffect(() => {
    async function prepare() {
      try {
        console.log("Starting resource load...");
        await SplashScreen.preventAutoHideAsync();

        await Font.loadAsync({
          ...MaterialIcons.font,
        });

        console.log("Resources loaded successfully");
      } catch (e) {
        console.warn("Error loading resources:", e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        console.log("Attempting to hide splash screen...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
        console.log("Splash screen hidden successfully");
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
      <SafeAreaProvider style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}}/>
            <Stack.Screen name="Tab Navigator" component={TabNavigator} options={{headerShown: false}} />
            <Stack.Screen name="Home" component={HomeScreen} />

          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
  );
}

export default SplitandShareApp;