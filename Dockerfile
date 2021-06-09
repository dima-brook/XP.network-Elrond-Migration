FROM rust:1-buster as build-subs

WORKDIR /usr

ENV LANG=C.UTF-8

RUN apt-get update && apt-get install -y git clang libclang-dev
RUN rustup update nightly
RUN rustup target add wasm32-unknown-unknown --toolchain nightly

RUN git clone https://github.com/xp-network/vm_hub_pallet /usr/vm_hub_pallet
WORKDIR /usr/vm_hub_pallet/substrate-node-template
RUN cargo build --release


FROM python:3.9-buster as runner

WORKDIR /usr

RUN apt-get update && apt-get install -y openssl sudo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

RUN rustup update nightly
RUN rustup component add rust-src --toolchain nightly
RUN rustup target add wasm32-unknown-unknown --toolchain stable
RUN cargo install cargo-contract

RUN useradd -ms /bin/bash runner
USER runner

WORKDIR /home/runner

COPY --from=build-subs /usr/vm_hub_pallet/substrate-node-template/target/release/node-template /home/runner/node-template

RUN wget -O erdpy-up.py https://raw.githubusercontent.com/ElrondNetwork/elrond-sdk-erdpy/master/erdpy-up.py
RUN python3.9 erdpy-up.py
ENV PATH="/home/runner/elrondsdk:$PATH"

WORKDIR /home/runner/app
COPY . /home/runner/app

WORKDIR /home/runner/app/elrond-mint-contract
RUN erdpy testnet prerequisites
RUN erdpy testnet clean
RUN erdpy testnet config

WORKDIR /home/runner/app/testsuite
RUN pip3.9 install -r requirements.txt
