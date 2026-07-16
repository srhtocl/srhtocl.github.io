

function MessageField(props) {

    return (
        <div className="flex flex-col w-full p-4 space-y-4">
            {
                !props.messages[0] ?

                    <div className="flex flex-col h-full justify-end pb-4">
                        <div className="flex w-full justify-start">
                            <div className="max-w-[75%] px-5 py-3 rounded-2xl shadow-md text-sm md:text-base font-['Ubuntu'] bg-white text-slate-800 border border-slate-200 rounded-tl-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                Merhaba.
                            </div>
                        </div>
                    </div>

                    :

                    props.messages.map((msgObjs, index) => (
                        <div
                            key={index}
                            id={index}
                            className={`flex w-full ${msgObjs.user === "admin" ? "justify-start" : "justify-end"}`}
                        >
                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base font-['Ubuntu'] flex flex-col gap-1 ${msgObjs.user === "admin"
                                ? "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                                : "bg-slate-700 text-white rounded-tr-none"
                                }`}>
                                <span>{msgObjs.data}</span>
                            </div>
                        </div>
                    ))
            }

        </div>
    );
}

export default MessageField;
