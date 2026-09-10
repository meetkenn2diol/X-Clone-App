import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  TextInput,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TRENDING_TOPICS } from "@/data/trendingtopics";


const SearchScreen = () => {
  const [searchInput, setSearchInput] = useState("");
  const filteredTopics = TRENDING_TOPICS.filter(
    (item) =>
      item.topic.toLowerCase().includes(searchInput.toLowerCase()) ||
      item.scope.toLowerCase().includes(searchInput.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Feather name="search" size={20} color="#657786" />
          <TextInput
            placeholder="Search Twitter"
            className="flex-1 ml-3 text-base"
            placeholderTextColor="#657786"
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput("")}>
              <Feather name="x" size={20} color="#657786" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Trending for you
          </Text>
          {filteredTopics.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="py-3 border-b border-gray-100"
            >
              <Text className="text-gray-500 text-sm">
                Trending in {item.scope}
              </Text>
              <Text className="font-bold text-gray-900 text-lg">
                {item.topic}
              </Text>
              <Text className="text-gray-500 text-sm">
                {item.tweets} Tweets
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
