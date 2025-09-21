import {Tabs} from 'expo-router'

export default function CeoTabLayout () {
    return (
        <Tabs>
            <Tabs.Screen name='index' options={{title: 'index'}} />
            <Tabs.Screen name='about' options={{title: 'about'}} />
        </Tabs>
    )
}