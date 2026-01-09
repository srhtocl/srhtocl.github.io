import React from "react";

function MessageField(props) {

    return (
        <div className="flex flex-col w-full p-4 space-y-4">
            {
                !props.messages[0] ?

                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-70">
                        <div className="bg-white/50 p-6 rounded-2xl shadow-sm text-center max-w-xs backdrop-blur-sm">
                            <p className="font-['Ubuntu'] text-sm">
                                Merhaba! Mesajlar anonim olarak iletilir ve tarama geçmişi temizlendiğinde silinir.
                            </p>
                        </div>
                    </div>

                    :

                    props.messages.map((msgObjs, index) => (
                        <div
                            key={index}
                            id={index}
                            className={`flex w-full ${msgObjs.user === "admin" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base font-['Ubuntu'] ${msgObjs.user === "admin"
                                ? "bg-slate-700 text-white rounded-tr-none"
                                : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                                }`}>
                                {msgObjs.data}
                            </div>
                        </div>
                    ))
            }

        </div>
    );
}

export default MessageField;
