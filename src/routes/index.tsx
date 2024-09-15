import { NavigationContainer } from "@react-navigation/native";
import TabRoutes from "./TiposDeNavegação/tab.routes";

export default function Routes(){
    return(
        <NavigationContainer>
            <TabRoutes/>
        </NavigationContainer>
    )
}

